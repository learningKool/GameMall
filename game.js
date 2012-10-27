
var util = require("./util").util;

var game = {
	// Max number of table
	MAX_TABLE: 5

    // Max number player in game
    , MAX_PLAYER: 40

    // Max Player in match
    , MAX_PLAYER_PER_MATCH: 8

    // max blind
    , MAX_BLIND: 100
	
    // max chip for player to play in match
    , MAX_CHIP_4_PLAY: 2000
    
    // Time out for a turn - ms
    , TURN_TIME_OUT: 20000 // ~ 20 seconds

    // LOCATION OF GAME
    , REFRESH_TABLE_TIMEOUT: 10000
    , LOCATION_LOBBY: 0
    , LOCATION_TABLE: 1

    // number of table
    , table_number: 0
    
    // List of match
    , tables: {}

    //number of player in game
    , player_number: 0
	
	// List of user
	, players: {}

    // available table id
//    , available_table_id: 0
};

game.addPlayer = function(player){
    if(game.player_number >= game.MAX_PLAYER){
        return -1; // game full
    }

    game.players[player.username] = player;
    game.player_number++;
    return 1;
};

game.createTable = function(hostPlayer){
    if(game.table_number >= game.MAX_TABLE){
        return null;
    }

    var table_id = (new Date().getTime())%100000000;
    game.tables[table_id] = new Table(table_id, hostPlayer);
    game.table_number++;
    return game.tables[table_id];
};

game.deleteTable = function(table_id){
    if(game.tables[table_id] == undefined){
        return false;
    }

    console.log('Table id [ ' + table_id + ' ] is deleted');
    delete game.tables[table_id];
    game.table_number--;
    return true;
};

//s
// Table of game
//
function Table(_id, host){
	this.id = _id;

	this.state = util.TABLE_STATE_WAITING;

	this.players = new Array(8);

    this.viewers = [];

	this.host_player = host;

	this.blind = 10;

    this.player_number = 0;

    /* variable in match */
    this.hasPlayerAllIn = false;

    this.total_chip = 0;

    this.current_bet = -1;

    this.current_turn = -1;

    this.slot_begin = -1; // no case to use

    this.slot_can_play = -1;

    this.lastest_winner = null;

    this.pots = [];

    this.current_pot = null;

    this.card = new Card();

    this.cards_on_board = new Array(5);

    this.playersOrderWithBestCard = [];
}

Table.prototype.setPlayerJoinMatch = function(player){
    if(this.player_number >= game.MAX_PLAYER_PER_MATCH){
        return -1;
    }

    if(this.players.indexOf(player) != -1){
        return -2;
    }
	
	this.deletePlayerFromViewers(player);
	
	
    return this.addPlayerToPlayers(player);
};

Table.prototype.setPlayerBeViewer = function(player){
	
	// player is playing, can not move to viewer list
//	if(player.state && player.state == util.PLAYER_STATE_PLAYING){
//		return -2;
//	}

    var result = this.deletePlayerFromPlayers(player) ? 1 : -1;

    if(result == -1)
        return -1;
    
    result = this.addPlayerToViewers(player);

	if(this.host_player.username == player.username)
		this.updateNewHost(player);
    
    return result;
};

Table.prototype.addPlayerToPlayers = function(player){
	var slot = this.findAvailableSlot();
    if(slot == -1){
        return -3;
    }
	
	player.slot = slot;
    player.state = util.PLAYER_STATE_WAITING;
    
    this.players[slot] = player;
    this.player_number++;

    if(!this.host_player){
        this.host_player = player;
        this.hostChange();
    }
	
	return 1;
};

Table.prototype.addPlayerToViewers = function(player){
    if(this.viewers.indexOf(player) != -1){
        return -1;
    }

    this.viewers.push(player);
    return 1;
};

Table.prototype.deletePlayerFromPlayers = function(player){
    var idx = this.players.indexOf(player);
	if( idx != -1){
        player.slot = -1;
        delete this.players[idx];
		this.player_number--;
        return true;
    }
    return false;
};

Table.prototype.deletePlayerFromViewers = function(player){
	var idx = this.viewers.indexOf(player);
	if(idx != -1){
		this.viewers.splice(idx, 1);
		return true;
	}
	
	return false;
};

Table.prototype.removePlayer = function(player){

//    if(player.state && player.state == util.PLAYER_STATE_PLAYING){
//        return false;
//    }

//	var idx = this.viewers.indexOf(player);
	var result = this.deletePlayerFromViewers(player);
	if(result){
        console.log('Table: delete ' + player.username + ' from viewers');
		return true;
	}else if(this.deletePlayerFromPlayers(player)){
		console.log('Table: delete ' + player.username + ' from players');
		if(this.host_player.username == player.username)
			this.updateNewHost(player);
        return true;
	}

	return false;
};

Table.prototype.findNewHost = function(){
    var player = null;
    this.players.forEach( function(element){
        if(!player && element){
            player = element;
        }
    });

    return player;
};

Table.prototype.findAvailableSlot = function(){
//    var slot_id = -1;
    for(var i = 0 ; i < this.players.length ; i++){
        if(!this.players[i])
            return i;
    }

    return -1;
};

Table.prototype.updateNewHost = function(){
    
		// if leaver is host, update new host
		if(this.player_number > 0){
            this.host_player = this.findNewHost();
			this.hostChange();
        }

        if(this.player_number == 0){
            this.host_player = null;
            this.hostChange();
        }
};

Table.prototype.changeBlind = function(player, value){
    if(this.host_player && this.host_player.username == player.username){
        if(this.state == util.TABLE_STATE_WAITING && value >= 0 && value < game.MAX_BLIND){
            this.blind = value;
            return true;
        }
        return false;
    }
    
    return false;
};

Table.prototype.changeSlot = function(player, new_slot){
    if(this.players.indexOf(player) == -1 || this.state == util.TABLE_STATE_PLAYING){
        return -1;
    }

//    console.log('new slot: ' + new_slot);
    if(this.players[new_slot]){
        return -2;
    }

    var old_slot = player.slot;
    delete this.players[old_slot];
    this.players[new_slot] = player;
    player.slot = new_slot;

    return player.slot;
};

Table.prototype.processNextTurn = function(){

    while(true){
        var min_bet = 999999;
        var isPlayAllIn = false;
        var remainPlayerLength = 0;
        var player_id = [];
        var total_bet = 0;
        this.players.forEach(function(element){
            console.log('current bet : ' + element.current_bet);
            if(element.current_bet > 0){
                if(element.isPlayingAllIn || isPlayAllIn){
                    isPlayAllIn = true;
                    min_bet = Math.min(min_bet, element.current_bet);
                }else{
                    total_bet += element.current_bet;
                    player_id.push(element.id);
                }
            }
        });

        console.log('min bet : ' + min_bet);
        if(isPlayAllIn){
            total_bet = 0;
            player_id = [];
            this.players.forEach(function(element){
                 if(element.current_bet != 0 && element.state == util.PLAYER_STATE_PLAYING){
                     console.log('username ' + element.username + ' current bet : ' + element.current_bet);
                     element.current_bet -= min_bet;
                     console.log('username ' + element.username + ' current bet : ' + element.current_bet);
                     total_bet += min_bet;
                     if(element.current_bet == 0){
                         element.isPlayingAllIn = false;
                     }
                     player_id.push(element.id);
                 }
            });
            console.log('player id: ' + player_id);
            if(player_id.length == 0)
                break;
            this.current_pot.player_id_list = player_id;
            this.current_pot.chip += total_bet;
            this.current_pot = new Pot();
            this.pots.push(this.current_pot);
        }else{
            console.log('isPlayAllIn false - player id: ' + player_id);
            if(player_id.length == 1){
                this.players.forEach(function(element){
                    if(element.current_bet != 0 && element.state == util.PLAYER_STATE_PLAYING){
                        element.playing_chip += element.current_bet;
                    }
                });
                break;
            }else if(player_id.length > 1){
                this.current_pot.player_id_list = player_id;
                this.current_pot.chip += total_bet;
                console.log('current pot chip: ' + this.current_pot.chip);
                console.log('list pot chip: ' + this.pots[0].chip);
            }
            break;
        }
    }
    // process to next turn;
    this.current_turn++;
    // set current bet to zero
    this.current_bet = 0;

    this.hasPlayerAllIn = false;

    // reset playing properties of player
    this.players.forEach( function(element){
        element.current_bet = 0;
        element.hasCompleteTurn = false;
        element.isPlayingAllIn = false;
    });
};

Table.prototype.getPlayingPlayerCount = function(){
    var count = 0;
    this.players.forEach( function(element){
        if(element.state == util.PLAYER_STATE_PLAYING){
            count++;
        }
    });
    return count;
};

Table.prototype.getPlayablePlayerCount = function(){
    var count = 0;
    this.players.forEach( function(element){
        if(element.state == util.PLAYER_STATE_PLAYING && element.playing_chip > 0){
            count++;
        }
    });
    return count;
};

Table.prototype.deal_card = function(){
    var data = {};
    var cardGenerator = this.card;
    var slot = {};
    switch(this.current_turn){
        case util.TURN_DEAL_IN_HAND:
        {
            this.players.forEach( function(element){
                slot = {};
                element.cards = new Array(2);
                element.cards[0] = cardGenerator.generateCard();
                slot['1'] = element.cards[0];
                element.cards[1] = cardGenerator.generateCard();
                slot['2'] = element.cards[1];

                data[element.slot] = slot;
            });
        }
        break;
        
        case util.TURN_THREE_CARD:
        {
            this.cards_on_board = new Array(5);
            this.cards_on_board[0] = cardGenerator.generateCard();
            this.cards_on_board[1] = cardGenerator.generateCard();
            this.cards_on_board[2] = cardGenerator.generateCard();
            slot = {};
            slot['1'] = this.cards_on_board[0];
            slot['2'] = this.cards_on_board[1];
            slot['3'] = this.cards_on_board[2];
            data['board'] = slot;
        }
        break;

        case util.TURN_FOURTH_CARD:
        {
            this.cards_on_board[3] = cardGenerator.generateCard();
            slot = {};
            slot['1'] = this.cards_on_board[3];
            data['board'] = slot;
        }
        break;

        case util.TURN_FIFTH_CARD:
        {
            this.cards_on_board[4] = cardGenerator.generateCard();
            slot = {};
            slot['1'] = this.cards_on_board[4];
            data['board'] = slot;
        }
        break;
    }

    return data;
};

Table.prototype.startMatch = function(player){
    if(this.host_player.username != player.username){
		return -1; // host mới đc start
    }

    if(this.state == util.TABLE_STATE_PLAYING){
        return -3; // bàn đang chơi
    }

	// check for player have chip 4 play is larger than 0
	var count = 0;
    var _blind = this.blind;
    var total_chip = 0;
	this.players.forEach( function(element){
//        console.log('count : ' + count);
//        console.log('table blind : ' + _blind);
		if(element.playing_chip > _blind * 2){ // chip của người chơi phải lớn hơn blind 2 lần
            count++;
		}
	});

    // check không đủ người chơi
	if(count < 2){
        this.total_chip = 0;
		return -2;
	}else{
        this.players.forEach( function(element){
            element.total_bet = 0;
            if(element.playing_chip > _blind * 2){ // chip của người chơi phải lớn hơn blind 2 lần
                element.current_bet = 0;
                element.total_bet = 0;
                element.state = util.PLAYER_STATE_PLAYING;
            }
        });
    }

    var _start_player;
    this.state = util.TABLE_STATE_PLAYING;
    this.hasPlayerAllIn = false;
    this.current_turn = util.TURN_DEAL_IN_HAND;

    // tính người sẽ chơi đầu tiên
    if(!this.lastest_winner || !this.players[this.lastest_winner.slot]){
        _start_player = this.host_player;
    }else{
        _start_player = this.lastest_winner;
    }
    
    _start_player.playing_chip -= this.blind;
    _start_player.current_bet += this.blind;
    _start_player.total_bet += this.blind;
    total_chip += this.blind;

    this.slot_can_play = this.findSlotForPlay(_start_player.slot);
    _start_player = this.players[this.slot_can_play];
    this.current_bet = this.blind * 2;

    _start_player.playing_chip -= this.current_bet;
    _start_player.current_bet += this.current_bet;
    _start_player.total_bet += this.current_bet;
    total_chip += this.current_bet;
    
    this.total_chip = total_chip;
    this.card.reset();

    // get started time of match
    this.started_time = new Date().getTime();
    this.host_lastedMatch = this.host_player.username;
	// catch user id play this match for logging
    var played_slot = [];
    this.players.forEach( function(element){
        played_slot[element.slot] = element.id;
    });

    this.played_slot = played_slot;

    this.pots = [];
    this.current_pot = new Pot();
    this.pots.push(this.current_pot);

	return 1;
};

// tố hết
Table.prototype.beat_all_in = function(player){
    if(this.slot_can_play != player.slot)
        return {type: -1, content: ' not your turn'};

    if(player.playing_chip <= 0)
        return {type: -2, content: ' not enough chip to play'}; // check for out of money

    if(player.isPlayingAllIn)
        return {type: -4, content: ' player can not play all-in again : maybe he is hacking'}; // player is playing all - in : maybe he's hacking

    this.slot_begin = player.slot;

    // get smallest chip player in table use value of all in
//    var value_all_in = this.findSmallerPlayingChip();
//    if(value_all_in == -1)
//        return {type: -3, content: ' maybe wrong some thing with play all-in'}; // error : maybe wrong something

    // increase current bet of table by value
//    this.current_bet += value_all_in;
//
//    // increase total chip of table by value
//    this.total_chip += value_all_in;
//
//    // minus playing chip of player
//    player.playing_chip -= value_all_in;
//
//    // increase total bet of player
//    player.current_bet += value_all_in;
//    player.total_bet += value_all_in;

    this.hasPlayerAllIn = true;
    var dif = player.playing_chip - this.current_bet;
    
    if(dif > 0){
        this.current_bet += dif;
    }

    var value = player.playing_chip;
    this.total_chip += value;

    player.current_bet += value;
    player.total_bet += value;
    player.isPlayingAllIn = true;
    player.playing_chip = 0;

    /*make sure every player who has current bet is smaller than current bet of table, must beat again*/
    var table_current_bet = this.current_bet;
    this.players.forEach( function(element){
        if(element.current_bet < table_current_bet)
                element.hasCompleteTurn = false;
    });

    return {type: value, content: ' OK!!'};

};

// bỏ lượt, không tố
Table.prototype.beat_check = function(player){
    if(this.slot_can_play != player.slot)
        return {type: -1, content: ' not your turn'}; // not turn

    if(player.playing_chip <= 0)
        return {type: -2, content: ' not enough chip to play'};

    if(player.current_bet < this.current_bet)
        return {type: -4, content: ' current bet of player is smaller than current bet of table, can not check must call or raise'}; // can not check, you must call or raise

    if(player.current_bet > this.current_bet)
        return {type: -4, content: ' current bet of player is smaller than current bet of table, can not check must call or raise. Maybe something wrong!'}; // error maybe wrong something

    return {type: 0, content: ' OK!!'};
};

// đầu hàng, bỏ ván
Table.prototype.beat_fold = function(player){
    if(this.slot_can_play != player.slot)
        return {type: -1, content: ' not your turn'};

    player.state = util.PLAYER_STATE_WAITING;
    return {type: 1, content: ' OK!!'};
};

// tăng mức tố lên mức cao hơn hiện tại
Table.prototype.beat_raise = function(player, new_value){
    if(this.slot_can_play != player.slot)
        return {type: -1, content: ' not your turn'};

    if(player.playing_chip <= 0)
        return {type: -2, content: ' not enough chip to play'};

//    if(new_value <= this.current_bet)
//        return {type: -4, content: ' new bet is equal or smaller than current bet of player'};;// wrong value

//    console.log('player.playing_chip : ' + player.playing_chip);
//    console.log('current_bet : ' + this.current_bet);
//    console.log('player.current_bet : ' + player.current_bet);
//    console.log('new_value : ' + new_value);
    var dif = this.current_bet + new_value - player.current_bet;

    if(player.playing_chip < dif)
        dif = player.playing_chip;
//        return {type: -3, content: ' player will play as all-in'}; // play as all-in
//
//    // update current bet of table

    this.current_bet += new_value;

    // set slot begin a turn is this player
    this.slot_begin = player.slot;

    // increase total chip of table by dif
    this.total_chip += dif;

    // minus playing chip of player
    player.playing_chip -= dif;

    // increase total bet of player
    player.current_bet += dif;
    player.total_bet += dif;

    // make sure every player who has current bet is smaller than current bet of table, must beat again
    var table_current_bet = this.current_bet;
    this.players.forEach( function(element){
        if(element.current_bet < table_current_bet)
            element.hasCompleteTurn = false;
    });
    
    return {type: dif, content: ' OK!!'};
};

// bắt đầu lượt mới, set mức tố cho lượt
Table.prototype.beat_bet = function(player, value){
    if(this.slot_can_play != player.slot)
        return {type: -1, content: ' not your turn'};

    if(player.playing_chip <= 0)
        return {type: -2, content: ' not enough chip to play'};

    if(this.current_bet != 0)
        return {type: -4, content: ' current bet of table is greater than 0'}; // only set new bet value when current bet is zero

    if(this.current_bet >= value)
        return -5; // new bet must is not equal or smaller than current bet

    if(player.playing_chip <= value)
        return -3; // play as all - in

    // set bet by blind of table
    this.current_bet = value;
    
    // increase total chip of table by blind
    this.total_chip += value;

    // set slot begin a turn is this player
    this.slot_begin = player.slot;

    // minus playing chip of player
    player.playing_chip -= value;

    // increase total bet of player
    player.current_bet += value;
    player.total_bet += value;

    // make sure every player who has current bet is smaller than current bet of table, must beat again
    this.players.forEach( function(element){
        if(element.current_bet < value)
            element.hasCompleteTurn = false;
    });

    return this.current_bet;
};

// Theo mức tố hiện tại của bàn
Table.prototype.beat_call = function(player){
    if(this.slot_can_play != player.slot)
        return {type: -1, content: ' not your turn'};

    if(player.playing_chip <= 0)
        return {type: -2, content: ' not enough chip to play'};

    if(this.current_bet <= 0)
        return {type: -4, content: ' chip bet of table is smaller than 0'};

    if(this.current_bet <= player.current_bet)
        return {type: -5, content: ' chip bet of player is greater than chip bet of table'}; // wrong value

    var dif = this.current_bet - player.current_bet;
//    console.log('diff: ' + dif);
    if(player.playing_chip < dif)
        return {type: -3, content: ' player will play as all-in'}; // play as all-in

    // increase total chip of table by dif

    this.total_chip += dif;

    // minus playing chip of player
    player.playing_chip -= dif;

    // increase total bet of player
    player.current_bet += dif;
    player.total_bet += dif;

    return {type: dif, content: ' OK!!'};

};

// tìm slot kế tiếp có thể chơi
Table.prototype.findSlotForPlay = function(old_slot){
    var next_slot = old_slot;

    do{
        next_slot = (next_slot + 1) % game.MAX_PLAYER_PER_MATCH;
//        console.log('next slot is ' + next_slot);
        if(next_slot == old_slot)
            return -1;
    }while(!this.players[next_slot]
            || (this.players[next_slot]
                && (this.players[next_slot].hasCompleteTurn // this player is done the turn
                    || this.players[next_slot].state == util.PLAYER_STATE_WAITING // this player is not in match
                    || this.players[next_slot].playing_chip <= 0 // this player is out of chip, can skip
                    || this.players[next_slot].isPlayingAllIn) // this player is playing all-in
                )
        ); //

    return next_slot;
};

Table.prototype.findSmallerBettingChip = function(){
    var value = 999999999;
    this.players.forEach(function(element){
        if(element && element.state == util.PLAYER_STATE_PLAYING && element.current_bet != 0){
            value = Math.min(value, element.current_bet);
        }
    });

    if(value == 999999999)
        value = -1;
    return value;
};

// Tính kết quả
Table.prototype.calculateResult = function(){

    var cards_on_board = this.cards_on_board;
//    var game_cards = this.card;
//    var result_player = [];
//    var order_result = {};
    var winner;
//    var winner_count = -1;
    var this_table = this;
    this.playersOrderWithBestCard = [];
    var players = [];
    this.players.forEach( function(element){

        if(element.state == util.PLAYER_STATE_PLAYING){
            element.pocker_hand = {type: '', best_cards:[]};
            if(this_table.current_turn <= util.TURN_FIFTH_CARD){
                console.log('one winner');
                winner = element;
                players.push(element);
                return;
            }
            element.pocker_hand = Card.getBestPokerHand(element.cards, cards_on_board);

                var idx = -1;
                for(var i = 0 ; i < players.length ; i++ ){
                    if( players[i].pocker_hand['type'] < element.pocker_hand['type']
                        || ( players[i].pocker_hand['type'] == element.pocker_hand['type']
                            && ( players[i].pocker_hand['best_cards'][4] < element.pocker_hand['best_cards'][4]
                                || ( players[i].pocker_hand['best_cards'][4] == element.pocker_hand['best_cards'][4]
                                    && players[i].pocker_hand['best_cards'][3] < element.pocker_hand['best_cards'][3] )
                                || ( players[i].pocker_hand['best_cards'][4] == element.pocker_hand['best_cards'][4]
                                    && players[i].pocker_hand['best_cards'][3] == element.pocker_hand['best_cards'][3]
                                    && players[i].pocker_hand['best_cards'][2] < element.pocker_hand['best_cards'][2] )
                                || ( players[i].pocker_hand['best_cards'][4] == element.pocker_hand['best_cards'][4]
                                    && players[i].pocker_hand['best_cards'][3] == element.pocker_hand['best_cards'][3]
                                    && players[i].pocker_hand['best_cards'][2] == element.pocker_hand['best_cards'][2]
                                    && players[i].pocker_hand['best_cards'][1] < element.pocker_hand['best_cards'][1] )
                                )
                            )
                    )
                    {
                        idx = i;
                        break;
                    }
                }
                if(idx == -1){
                     players.push(element);
                }else{
                    players.splice(idx, 0, element);
                }
            }
    });

    if(players.length > 0){
        winner = players[0];
        this.playersOrderWithBestCard = players;
    }

    if(!winner){
        this.winner = undefined;
        return false;
    }else{
        this.winner = winner;
        return true;
    }
};

Table.prototype.getWinners = function(){
    var winners = [];
    var count = 0;
    var winner = {};
    while(0 < this.pots.length){
        if(this.pots[0].chip == 0)
            break;
        var player = this.playersOrderWithBestCard[0];
        winner = {};
        winner.chip_win = 0;
        winner.best_cards = [];
        for(var i = 0 ; i < this.pots.length ;){
            console.log('i : ' + i + ' chip pot : ' + this.pots[i].chip + ' player ' + this.pots[i].player_id_list);
            if(this.pots[i].player_id_list.indexOf(player.id) != -1){
                winner.username = player.username;
                winner.slot = player.slot;
                winner.chip_win += this.pots[i].chip;
                if(!winner.content && player.pocker_hand){
                    winner.content = Card.getPokerHandRanking(player.pocker_hand['type']);
                }
                winner.best_cards = player.pocker_hand['best_cards'];

                player.playing_chip += this.pots[i].chip;
                winner.playing_chip = player.playing_chip;

                this.pots.splice(0,1);
            }else{
                i++;
            }
        }

        winners.push(winner);
        this.playersOrderWithBestCard.splice(0,1);
    }
    return winners;
}

// lưu log của trận đấu
Table.prototype.saveMatchLog = function(db_connector){
//    db_connector.query('INSERT INTO log_match VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)'
//        , [this.id, this.started_time, this.blind, this.total_chip
//            , this.played_slot[0] ? this.played_slot[0] : -1
//            , this.played_slot[1] ? this.played_slot[1] : -1
//            , this.played_slot[2] ? this.played_slot[2] : -1
//            , this.played_slot[3] ? this.played_slot[3] : -1
//            , this.played_slot[4] ? this.played_slot[4] : -1
//            , this.played_slot[5] ? this.played_slot[5] : -1
//            , this.played_slot[6] ? this.played_slot[6] : -1
//            , this.played_slot[7] ? this.played_slot[7] : -1
//            , this.winner ? this.winner.id : -1 ]
//    );
    db_connector.query('INSERT INTO public.log_match' +
        '(table_id, started_time, blind, host_name, slot_1, slot_2, slot_3, slot_4, slot_5, slot_6, slot_7, slot_8) ' +
        'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)'
        , [this.id, this.started_time, this.blind, this.host_lastedMatch
            , this.played_slot[0] ? this.played_slot[0] : -1
            , this.played_slot[1] ? this.played_slot[1] : -1
            , this.played_slot[2] ? this.played_slot[2] : -1
            , this.played_slot[3] ? this.played_slot[3] : -1
            , this.played_slot[4] ? this.played_slot[4] : -1
            , this.played_slot[5] ? this.played_slot[5] : -1
            , this.played_slot[6] ? this.played_slot[6] : -1
            , this.played_slot[7] ? this.played_slot[7] : -1]
    );
    delete this.played_slot;
};

//
// Player information
//
function Player(id, username){
    this.id = id;

	this.username = username;

    this.level = 1;

	this.isActive = false;

    this.isPlaying = false;

    this.location = game.LOCATION_LOBBY;

//	this.chip = 1000;

    // value in playing
    this.slot = -1;
    
    this.isPlayingAllIn = false;

    this.hasCompleteTurn = false;

    // bet each turn
    this.current_bet = 0;

    // bet each match
    this.total_bet = 0;

    this.turn_type = util.BEAT_NONE;
	
	this.playing_chip = 0;

    this.chip = 10000;

    this.cards = new Array(2);
}

Player.prototype.loadChipToPlay = function(chip){
    if(chip <= 0) return -1;
//    if(this.chip <= 0) return -1;

	var actual_chip = -1;
	actual_chip = game.MAX_CHIP_4_PLAY - this.playing_chip;
    if(actual_chip <= 0)
        return -2;
    actual_chip = Math.min(actual_chip, chip);

//	this.chip -= actual_chip;
	this.playing_chip += actual_chip;
    this.chip -= actual_chip;
		
	return actual_chip;
};

Player.prototype.returnChip = function(chip){
    if(chip <= 0) return -1;

    var actual_chip = -1;
//	actual_chip = game.MAX_CHIP_4_PLAY - ;
    actual_chip = Math.min(this.playing_chip, chip);

	this.playing_chip -= actual_chip;
    this.chip += actual_chip;

	return actual_chip;
};

/*
    CARD OF GAME

    expr of card is: value = rank * 4 + suit;
    Min Rank is : 2
    Minimum value of card is 8 which means 2*4 + 0;
 */

Card.MIN_VALUE = 2 * 4 + 0; // 8 is 2 bí
Card.MAX_VALUE = ( 2 + 12 ) * 4 + 3; //  59 - xì cơ
Card.MIN_RANK = 2;
Card.MAX_RANK = 2 + 12;
Card.SUIT_SPADE     = 0;
Card.SUIT_CLUB      = 1;
Card.SUIT_DIAMOND   = 2;
Card.SUIT_HEART     = 3;
// rank of poker hand
Card.HAND_ROYAL_PLUS     = 9;
Card.HAND_STRAIGHT_PLUS  = 8;
Card.HAND_FOUR_OF_A_KIND = 7;
Card.HAND_FULL_HOUSE     = 6;
Card.HAND_PLUS           = 5;
Card.HAND_STRAIGHT       = 4;
Card.HAND_THREE_OF_A_KIND = 3;
Card.HAND_TWO_PAIR       = 2;
Card.HAND_PAIR           = 1;
Card.HAND_HIGHT_CARD     = 0;

function Card(){

    this.dealedCard = [];

    this.generateCard = function(){
        var new_card = -1;
        if(this.dealedCard.length == Card.MAX_VALUE - Card.MIN_RANK + 1)
            return new_card;
        do{
            
            new_card = Card.randomizeValue();
            
        }while(this.dealedCard.indexOf(new_card) != -1);

        this.dealedCard.push(new_card);
        return new_card;
    };

    this.reset = function(){
        this.dealedCard = [];
    };
}

Card.getRank = function(card){
        return Math.floor(card / 4);
};

Card.getSuit = function(card){
        return card % 4;
};

Card.randomizeValue = function(){
        return Math.floor(Math.random() * (Card.MAX_VALUE + 1 - Card.MIN_VALUE) + Card.MIN_VALUE);
};

Card.getBestPokerHand = function(card_in_hand, card_on_board){
//        if(typeof card_in_hand !== 'Array' && typeof card_on_board !== 'Array'){
//            return null;
//        }

//        console.log('getBestPokerHand');
//        console.log(typeof card_in_hand);
//    console.log(typeof card_on_board);

	var result = {};
	var cards = [];
	card_in_hand.forEach(function(element){
		cards.push(element);
	});
	card_on_board.forEach(function(element){
		cards.push(element);
	});

	cards = cards.sort( function(a,b){return a - b;});
//    console.log('cards : ' + cards);
    
	// check plus
	var plus_cards = Card.getPlusCards(cards);
	var isHavePlusCards = false;
	if(plus_cards.length == 5){ // có thùng trong bài
//		console.log('Find a plus: ' + plus_cards);
		isHavePlusCards = true;
	}

	var straight_cards = Card.getStraightCards(cards);
    var isHaveStraightCards = false;
    if(straight_cards.length > 0){ // có 1 hoặc n sảnh trong bài
//        console.log('Find a straight: ' + straight_cards.length);
        isHaveStraightCards = true;
    }

    if(isHavePlusCards)
    {
        if(isHaveStraightCards)
        {
            var straight_plus_cards = [];
            straight_cards.forEach( function(element){
                var temp = Card.getPlusCards(element);
                if(temp.length == 5)
                    straight_plus_cards = temp;
            });

            if(straight_plus_cards.length == 5){
                if(Card.getRank(straight_plus_cards[4]) == Card.MAX_RANK){
                    result['type'] = Card.HAND_ROYAL_PLUS;
                }else{
                    result['type'] = Card.HAND_STRAIGHT_PLUS;
                }
                result['best_cards'] = straight_plus_cards;
                return result;
            }
        }
    }
    
    var same_cards = Card.getSameCards(cards, 4);
	if(same_cards.length == 1){ // 7 con bài - nên xem như chỉ có 1 bộ tứ quí
		result['type'] = Card.HAND_FOUR_OF_A_KIND;
		result['best_cards'] = same_cards[0];
		result['best_cards'][4] = Card.getBiggestCard(cards, same_cards[0]);
        result['best_cards'] = result['best_cards'].sort( function(a,b){return a - b;});
		return result;
	}

	same_cards = Card.getSameCards(cards, 3);
	if(same_cards.length > 0){ // lấy bộ 3 con lớn nhất nếu có
        var pair_card = Card.getSameCards(cards, 2, same_cards[same_cards.length - 1]);
        if(pair_card.length > 0){
            result['type'] = Card.HAND_FULL_HOUSE;
            result['best_cards'] = same_cards[same_cards.length - 1];
            result['best_cards'][3] = pair_card[pair_card.length - 1][0];
            result['best_cards'][4] = pair_card[pair_card.length - 1][1];
            result['best_cards'] = result['best_cards'].sort( function(a,b){return a - b;});
            return result;
        }
    }
	if(isHavePlusCards){
		result['type'] = Card.HAND_PLUS;
		result['best_cards'] = plus_cards;
		return result;
	}

	if(isHaveStraightCards){
		result['type'] = Card.HAND_STRAIGHT;
		result['best_cards'] = straight_cards;
		return result;
	}
    
    if(same_cards.length > 0){
        result['type'] = Card.HAND_THREE_OF_A_KIND;
        result['best_cards'] = same_cards[same_cards.length - 1];
		result['best_cards'][3] = Card.getBiggestCard(cards, result['best_cards']);
        result['best_cards'][4] = Card.getBiggestCard(cards, result['best_cards']);
        result['best_cards'] = result['best_cards'].sort( function(a,b){return a - b;});
        return result;
    }

    same_cards = Card.getSameCards(cards, 2);
    if(same_cards.length >= 2) // lấy 2 cặp lớn nhất
    {
        result['type'] = Card.HAND_TWO_PAIR;
        result['best_cards'] = same_cards[same_cards.length - 1];
		result['best_cards'][2] = same_cards[same_cards.length - 2][0];
        result['best_cards'][3] = same_cards[same_cards.length - 2][1];
        result['best_cards'][4] = Card.getBiggestCard(cards, result['best_cards']);
        result['best_cards'] = result['best_cards'].sort( function(a,b){return a - b;});
        return result;
    }
    else if(same_cards.length == 1)// lấy 1 cặp và 3 con lớn nhất
    {
        result['type'] = Card.HAND_PAIR;
        result['best_cards'] = same_cards[0];
        result['best_cards'][2] = Card.getBiggestCard(cards, result['best_cards']);
        result['best_cards'][3] = Card.getBiggestCard(cards, result['best_cards']);
        result['best_cards'][4] = Card.getBiggestCard(cards, result['best_cards']);
        result['best_cards'] = result['best_cards'].sort( function(a,b){return a - b;});
        return result;
    }

    result['type'] = Card.HAND_HIGHT_CARD;
    cards.splice(0, 2);
    result['best_cards'] = cards;
    return result;
};

// return biggest plus of cards
Card.getPlusCards = function(cards) {
	if (cards.length < 5) return new Array(0);

	var result = [[],[],[],[]];
	var count = [-1,-1,-1,-1];
//	result[count] = cards[0];
	for (var i = 0; i < cards.length; i++) {
//        console.log('suit: ' + Card.getSuit(cards[i]) + ' card: ' + cards[i]);
        var suit = Card.getSuit(cards[i]);
        if(count[suit] == 4){
            result[suit].shift();
            result[suit][count[suit]] = cards[i];
        }else{
            count[suit] += 1;
            result[suit][count[suit]] = cards[i];
        }
	}

    var card_max = -1;
    var suit_max = -1;
    for (var j = 0; j < result.length; j++) {
        if(result[j].length >= 5 && result[j][4] > card_max){
            card_max = result[j][4];
            suit_max = j;
        }
    }

    var r = [];
    if(suit_max != -1){
        r = result[suit_max];
    }

//	console.log('getPlusCards - max plus: ' + r);
	return r;
    };

//return an array of chunk of cards
Card.getSameCards = function(cards, amount, exceptCards){
    if (cards.length < amount
        || amount < 2 || amount > 4) return new Array(0);

        var result = [];
        var pos = 0;
        var count = 0;
        do{
//            console.log('card at ' + pos + ' is ' + this.getRank(cards[pos]));
//            console.log('card at ' + (pos + amount - 1) + ' is ' + this.getRank(cards[pos + amount - 1]));
//            console.log('+++++++++++++++++');
            if( (this.getRank(cards[pos]) == this.getRank(cards[pos + amount - 1]))
                && ( !exceptCards || (exceptCards
                                        && exceptCards.indexOf(cards[pos]) == -1
                                        && exceptCards.indexOf(cards[pos + amount - 1]) == -1
                                      )
                    )
                ){
                result[count] = [];
                for(var j = 0 ; j < amount ; j++){
                    result[count][j] = cards[pos+j];
                }
                count++;
                pos += amount;
            } else {
                pos++;
            }
        }while(pos <= cards.length - amount);

        console.log('getSameCards' + amount + ' - length: ' + result.length);
        console.log('============');
        for( var i = 0 ; i < result.length ; i++){
            console.log('getSameCards : ' + result[i].toString());
        }
        return result;
    };

// get arrays straight cards
Card.getStraightCards = function(cards){
        if (cards.length < 5) return new Array(0);

        var result = [];
        var count = 0;
        var numberArray = 0;
        result[numberArray] = [];
        result[numberArray][count] = cards[0];
        for (var i = 0; i < cards.length - 1; i++) {
            if (this.getRank(cards[i]) + 1 == this.getRank(cards[i + 1])) {
                if (count == 4) {
                    // nếu mảng hiện tại đã đủ 5 phần tử
                    // tạo mảng mới với 4 phần tử cuối của mảng trước đó
                    result[numberArray+1] = [result[numberArray][1], result[numberArray][2],
                                    result[numberArray][3], result[numberArray][4]];
                    // Thêm phần tử mới vào mảng mới
                    numberArray++;
                    result[numberArray][count] = cards[i + 1];
                } else {
                    count++;
                    result[numberArray][count] = cards[i + 1];
                }
            } else {
                if (i >= cards.length - 5) break;
                if(count == 4){
                    numberArray++;
                }
                count = 0;
                result[numberArray] = [];
                result[numberArray][count] = cards[i + 1];
            }
        }

        if(count < 4)
        {
            result.splice(numberArray, 1);
        }

        console.log('getStraightCards - length: ' + result.length);
        for (var j = 0; j < result.length; j++) {
            console.log('getStraightCards - ' + j + ' : ' + result[j]);
        }
        return result;
};

Card.getBiggestCard = function(cards, exceptCards){
    for(var i = cards.length - 1 ; i >= 0  ; i--){
        if(exceptCards.indexOf(cards[i]) == -1)
            return cards[i];
    }

    return -1;
};

Card.getPokerHandRanking = function(type){
    switch(type){
        case this.HAND_ROYAL_PLUS:          return "Royal Plus";
        case this.HAND_FOUR_OF_A_KIND:      return "Four A Kind";
        case this.HAND_FULL_HOUSE:          return "Full House";
        case this.HAND_PLUS:                return "Plus";
        case this.HAND_STRAIGHT:            return "Straight";
        case this.HAND_THREE_OF_A_KIND:     return "Three A Kind";
        case this.HAND_TWO_PAIR:            return "Two Pair";
        case this.HAND_PAIR:                return "A Pair";
        case this.HAND_HIGHT_CARD:          return "High Card";
    }
    return '';
};

/*
    Match pot
 */

function Pot(player_id_list, chip){
    // players who is follow in Pot
    if(player_id_list)
        this.player_id_list = player_id_list;
    else
        this.player_id_list = [];

    // total chip in pot
    if(chip)
        this.chip = chip;
    else
        this.chip = 0;
}

//
// Export modules
//
exports.game = game;
exports.CreatePlayer = function(id, username){
    return new Player(id, username);
};

exports.Card = Card;
