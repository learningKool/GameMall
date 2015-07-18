// Require HTTP module (to start server) and Socket.IO

// Global var for game
//var http = require('http')
var httpServer = require("./http-server")
    , router = require("./router")
    , requestHandlers = require("./requestHandlers");
var handle = {};
    handle["/"] = requestHandlers.index;
    handle["/start"] = requestHandlers.start;
    handle["/dieukhien"] = requestHandlers.dieukhien;
//    handle["/upload"] = requestHandlers.upload;
//    handle["/show"] = requestHandlers.show;
    handle["/index"] = requestHandlers.index;
    handle["/js"] = requestHandlers.loadData;
    handle["/css"] = requestHandlers.loadData;
    handle["/emotions"] = requestHandlers.loadData;
    handle["/img"] = requestHandlers.loadData;


var mysql = require('mysql')
    , url = require("url")
    , pg = require("pg");

var main_game = require("./game")
    , util = require("./util").util
    , card = main_game.Card
	, clientCfg = require("./clientConfig");

// List Client who is online 
var clients = {};
var game = main_game.game;
var port = 80;

// Start the http server
var server = httpServer.start(router.route, handle, port);
log('port: ' + port);
//server.listen(8080);
//log('HTTP Server is started!');
// Create a Socket.IO instance, passing it our server
var io = require('socket.io')(server);
// var socket = io.listen(server);
log('Server is started!');
log('update config for client');
clientCfg.updateConfig();

log('trying connect to database....');
var db_config = require('./db_config');
var conString = "tcp://postgres:root@localhost:5432/pokerdb";

var db_connector = new pg.Client(process.env.DATABASE_URL);
//var db_connector = new pg.Client(conString);
//db_connector.connect();

//var db_connector = mysql.createClient(db_config);
//db_connector.query('USE ' + db_config.DATABASE);
log('connect to database success!');
// assuming io is the Socket.IO server object
// socket.configure(function () { 
  // socket.set("transports", ["xhr-polling"]); 
  // socket.set("polling duration", 10); 
// });

var usernames = {};
// Add a connect listener
io.on('connection', function(client){

    clients[client.id] = client;
    log(client.id + ' call a connect to server!');
//    var card = card;
//    var hand = [17,29,45,49,51];//
//    var best_hand = card.getBestPokerHand([53,55], hand);
//    log('type: ' + best_hand['type']);
//    log('best_cards: ' + best_hand['best_cards']);

	// handle message from client
	client.on('message', function(){
		log('Received message from client!');
	});

    // handle event when user disconnect to server
	client.on('disconnect', function(){
		// clearInterval(interval);
        var username = client.username;
        delete usernames[username];
		log('Server has disconnected with ' + username);

        log('delete username: ' + username);
        var player = game.players[username];
        if(player){
//            db_connector.query('UPDATE public.user SET last_logout=CURRENT_TIMESTAMP WHERE id=$1', [player.id]);
            if(player.table){
                var slot = player.slot;
                if(player.table.removePlayer(player)){
                    if(player.table.player_number != 0 || player.table.viewers.length != 0){
                        broadcastTable(util.EMIT_LEAVE_TABLE, {type: 1, username: client.username}, player.table);

//                        log('slot:' + player.slot);
//                        log('slot_can_play:' + player.table.slot_can_play);
                        if(player.table.state == util.TABLE_STATE_PLAYING // table đang trong ván đánh
                            && player.state == util.PLAYER_STATE_PLAYING // user là người đang chơi
                            && slot == player.table.slot_can_play) // user là người đang đến lượt đánh
                        {
                            log('reset interval');
                            if(player.table.timeOutInterval){
                                log('reset interval ok!');
                                clearInterval(player.table.timeOutInterval);
                                processTable(player.table);
                            }
                        }
                    }else{
                        if(player.table.timeOutInterval){
                            clearInterval(player.table.timeOutInterval);
                        }
                        game.deleteTable(player.table.id);

                        responseListTables();
                    }
                }
            }
            // trả chip còn dư cho hệ thống
//            if(player.playing_chip > 0)
//                db_connector.query('INSERT INTO public.log_chip VALUES($1, $2,CURRENT_TIMESTAMP)', [player.id, player.playing_chip]);

            delete game.players[username];
        }
        
        delete clients[client.id];

        responseEventLog(username, "đã thoát game!", util.STYLE_RED);
	});

    // registry a username for who have just login
    client.on(util.EMIT_REGISTRY_ACCOUNT, function(data){
        log(data.username + ' registry!!!');

        var username = data.username;
        var password = data.password;
//        var query = db_connector.query('SELECT * FROM public.user WHERE name = $1', [username]);
        var name_is_used = false;
        if(usernames[username])
//        query.on('row', function(row)
        {
            name_is_used = true;
        }
//        );

//        query.on('end', function(){
//            console.log('name_is_used: ' + name_is_used);
//            var result = 1;
//            if(name_is_used){
//                result = -1;
//            }else{
//                db_connector.query('INSERT INTO public.user(name, password, active) VALUES($1, md5($2), false)', [username, password]);
//            }
//            client.emit(util.EMIT_REGISTRY_ACCOUNT, {result: result});
//        });

//        db_connector.query('SELECT * FROM user WHERE `name` = ?', [username],
//            function(err, rs1){
//                if (err) {
//                  log(err);
//                }
//
//                var result = 1;
//                if(rs1.length == 0){
//                    db_connector.query('INSERT INTO user(`name`, `password`, active) VALUES(?, MD5(?), 0)', [username, password]
//                        , function(err, rs2){
//                            if (err) {
//                              log(err);
//                            }else{
//                                client.emit(util.EMIT_REGISTRY_ACCOUNT, {result: result});
//                            }
//                        }
//                    );
//
//                } else {
//                    result = -1;
//                    client.emit(util.EMIT_REGISTRY_ACCOUNT, {result: result});
//                }
//            }
//        );
    });

    client.on(util.EMIT_LOGIN, function(data){
        log(data.username + ' login!!!');

        var username = data.username;
        var password = data.password;
//        var query = db_connector.query("SELECT * FROM public.user WHERE name = $1 AND password = md5($2)", [username, password]);

//        console.log(query);
        //can stream row results back 1 at a time
//        query.on('row', function(result)
        {
//            console.log("id: %s", result.id); //Beatle name: John
//            console.log("name: %s", result.name); //Beatle name: John
//            console.log("active: %s", result.active); //Beatle name: John
                var result_login = 1;
//            console.log('result: ' + result);
//                if(!result){
//                    result_login = -1;
//                }else if(result.active == false){
//                    result_login = -2;
//                }else
            
                {
                    var player_id = (new Date().getTime())%100000000;
                    var player = main_game.CreatePlayer(player_id, username);
                    if(player == undefined){
                        log('player is undefined');
                    }

//                    if(result.type == 1){
                        client.isAdmin = false;
//                        console.log('is admin ' + client.isAdmin);
//                    }

                    player.state = util.PLAYER_STATE_WAITING;
                    player.client = client;
                    game.addPlayer(player);

                    if(clients[client.id]){
                        clients[client.id].username = username;

                        broadcastInGame(util.EMIT_LOGIN, {type: 1, username: username}, game.players, true, username);
                        responseListTables(client);

//                        db_connector.query('UPDATE public.user SET last_login=CURRENT_TIMESTAMP WHERE id = $1', [result.id]);

                        responseEventLog(username, "vừa vào game!", util.STYLE_YELLOW);
                        responsePersonalInfo(client, player);
                    }
                }
                client.emit(util.EMIT_LOGIN, {type: 0, result: result_login});
//                if(result_login != 1)
//                    client.disconnect();
        }
//        );

//        //fired after last row is emitted
//        query.on('end', function() {
//          console.end();
//        });
//        var query = db_connector.query('SELECT * FROM user WHERE `name` = ?', [username],// AND `password` = MD5(?)
//	        function(err, results){
//                if (err) {
//                  log(err);
//                }
//
//                var result_login = 1;
//
//                if(results.length == 0){
//                    result_login = -1;
//                }else if(results[0].active == 0){
//                    result_login = -2;
//                }else{
//                    var player = main_game.CreatePlayer(results[0].id, username);
//                    if(player == undefined){
//                        log('player is undefined');
//                    }
//                    player.state = util.PLAYER_STATE_WAITING;
//                    player.client = client;
//                    game.addPlayer(player);
//
//                    if(clients[client.id]){
//                        clients[client.id].username = username;
//
//                        broadcastInGame(util.EMIT_LOGIN, {type: 1, username: username}, game.players, true, username);
//                        responseListTables(client);
//
//                        db_connector.query('UPDATE user SET last_login=NOW() WHERE id=?', [results[0].id]);
//
//                        responseEventLog(username, "vừa vào game!", util.STYLE_YELLOW);
//                        responsePersonalInfo(client, player);
//                    }
//                }
//
//                client.emit(util.EMIT_LOGIN, {type: 0, result: result_login});
//                if(result_login != 1)
//                    client.disconnect();
//            });
    });

    // user create table
    client.on(util.EMIT_CREATE_TABLE, function(){
        if(game.players[client.username] && game.players[client.username].table){
            client.emit(util.EMIT_CREATE_TABLE, {type: 0, result: -1});
            return;
        }
        
        var player = game.players[client.username];
        var new_table = game.createTable(player);

        if(new_table){
            new_table.hostChange = function(){
                if(new_table.state == util.TABLE_STATE_WAITING){
                    if(new_table.host_player){
                        broadcastTable(util.EMIT_HOST_CHANGE, {host_name: new_table.host_player.username}, new_table);
                    }else{
                        broadcastTable(util.EMIT_HOST_CHANGE, {host_name: 'none'}, new_table);
                    }
                }
            };

            // set player to table
            new_table.setPlayerJoinMatch(game.players[client.username]);
            player.table = new_table;
            player.location = game.LOCATION_TABLE;

            client.emit(util.EMIT_CREATE_TABLE, {type: 0, result: 1, table_id: player.table.id, username: client.username
                , chip: player.playing_chip, slot: player.slot, level: player.level, blind: player.table.blind});
            responseListTables();
//            responsePersonalInfo(client, player);
        }else{
            client.emit(util.EMIT_CREATE_TABLE, {type: 0, result: -1});
        }
    });

    // user join table
	client.on(util.EMIT_JOIN_TABLE, function(data){
        var tableId = data.table_id;
        log(client.username + ' join table id ' + tableId);
        if (!game.tables[tableId]) {
            return;
        }

        var player = game.players[client.username];
//        var player_list = game.tables[tableId].players;
        var result = -1;
        if(game.tables[tableId].players.indexOf(player) == -1){
            result = game.tables[tableId].addPlayerToViewers(player);
        }

        if (1 == result) {
            log(client.username + ' join table id ' + tableId + ' success!');
            broadcastTable(util.EMIT_JOIN_TABLE
                , { type: 1,
                    player: {
                        username: client.username,
                        chip: player.chip,
                        location: 'viewer'
                    }
                }
                , game.tables[tableId]
                , client.username
            );
            player.table = game.tables[tableId];
            player.location = game.LOCATION_TABLE;

            // notify users in lobby that have a user leave lobby to join table.
            broadcastInGame(util.EMIT_LEAVE_LOBBY, {type: 1, username: player.username}, game.players, true);

            var table_players = player.table.players;
            var players = [];
            var data = {};

            for(var i = 0 ; i < 8 ; i++){
                var p = player.table.players[i];
                if(p){
                    var data = {};
                    data['id'] = p.id;
                    data['username'] = p.username;
                    data['level'] = p.level;
                    data['chip'] = p.playing_chip;
                    data['slot'] = p.slot;

                    players.push(data);
                }
            }

            client.emit(util.EMIT_JOIN_TABLE, {type: 0, result: result, table_id: tableId
                , length: player.table.player_number, players: players, blind: player.table.blind});
//            responsePersonalInfo(client, player);
            responseEventLog(client.username, " đã vào bàn.", util.STYLE_WHITE, player.table);
        }
        else{
            client.emit(util.EMIT_JOIN_TABLE, {type: 0, result: result});
        }
    });

    // user leave table - return to lobby
    client.on(util.EMIT_LEAVE_TABLE, function(){
        var player = game.players[client.username];
         var result = false;
        var slot_leave = player.slot;
        if(player.location == game.LOCATION_TABLE && player.table)
            result = player.table.removePlayer(player);

        if(result){
            var table = player.table;
            log(player.username + ' leave table ' + table.id);

            if(player.table.state == util.TABLE_STATE_PLAYING // table đang trong ván đánh
                && player.state == util.PLAYER_STATE_PLAYING // user là người đang chơi
                && slot_leave == player.table.slot_can_play) // user là người đang đến lượt đánh
            {
                if(player.table.timeOutInterval){
                    clearInterval(player.table.timeOutInterval);
                    processTable(player.table);
                }
            }
            
            player.location = game.LOCATION_LOBBY;
            delete player.table;

            if(table.player_number != 0 || table.viewers.length != 0){
                broadcastTable(util.EMIT_LEAVE_TABLE, {type: 1, username: client.username, slot: slot_leave}, table);
            }else{
                game.deleteTable(table.id);
                responseListTables();
            }

            // notify users in lobby that have a user join lobby
            broadcastInGame(util.EMIT_JOIN_LOBBY, {type: 1, username: player.username}, game.players, true, player.username);
            responseEventLog(client.username, " đã thoát bàn.", util.STYLE_WHITE, table);
        }

        client.emit(util.EMIT_LEAVE_TABLE, {type: 0, result: result});
        responseListTables(client);
    });

    client.on(util.EMIT_CHAT_IN_TABLE, function(data){
        var table = game.players[client.username].table;
        if(table){
            broadcastTable(util.EMIT_CHAT_IN_TABLE, {sender: client.username,  text: data.text}, table);
        }
    });

    // user is viewer in table, don't play
    client.on(util.EMIT_BE_VIEWER, function(){
        var player = game.players[client.username];
        var old_slot = player.slot;

        var result = player.table.setPlayerBeViewer(player);
        if(result == 1){
            broadcastTable(util.EMIT_BE_VIEWER, {type: 1, username: player.username, slot: old_slot}, player.table, player.username);
            broadcastInGame(util.EMIT_UPDATE_N_PLAYER,
                {table_id: player.table.id, number_player: player.table.player_number}, game.players, true );
        }

        client.emit(util.EMIT_BE_VIEWER, {type: 0, result: result});
    });

    // user want to play a match in table
    client.on(util.EMIT_JOIN_MATCH, function(){
        var player = game.players[client.username];

        var result = player.table.setPlayerJoinMatch(player);

        var data = {username: player.username
                , chip: player.playing_chip, slot: player.slot, level: player.level};

        if(result == 1){
            broadcastTable(util.EMIT_JOIN_MATCH, {type: 1, player: data}, player.table, player.username);
            broadcastInGame(util.EMIT_UPDATE_N_PLAYER,
                {table_id: player.table.id, number_player: player.table.player_number}, game.players, true );
        }
        
        client.emit(util.EMIT_JOIN_MATCH, {type: 0, result: result, player: data});
    });

    client.on(util.EMIT_CHANGE_SLOT, function(data){
        var player = game.players[client.username];
        var table = player.table;
        var new_slot = Math.abs(data.slot);
        var old_slot = player.slot;
//        log('new_slot ' +  data.slot);
        new_slot = table.changeSlot(player, new_slot);
        if(new_slot >= 0){
            broadcastTable(util.EMIT_CHANGE_SLOT, {type: 1, old_slot: old_slot, slot: new_slot
                , username: player.username, chip: player.playing_chip, level: player.level
                }, table);
        }

//        client.emit(util.EMIT_CHANGE_SLOT, {type: 0, result: new_slot});
    });

    // host kick player out of table
    client.on(util.EMIT_KICK_PLAYER, function(data){
        var kicked_username = data.username;
        var player = game.players[client.username];

        var result = false;
        if(player.table && player == player.table.host_player){
            if(game.players[kicked_username]){
                result = player.table.removePlayer(game.players[kicked_username]);
            }
        }

        if(result){
            broadcastTable(util.EMIT_KICK_PLAYER, {type: 1, username: kicked_username}, player.table, player.username);
            broadcastInGame(util.EMIT_UPDATE_N_PLAYER,
                {table_id: player.table.id, number_player: player.table.player_number}, game.players, true );
        }

        // response to kicker 
        client.emit(util.EMIT_KICK_PLAYER, {type: 0, result: result, username: kicked_username});

        // response to kicked user
        game.players[kicked_username].client.emit(util.EMIT_KICK_PLAYER, {type: 2});
    });

    // host change pid
    client.on(util.EMIT_CHANGE_BLIND, function(data){
        var player = game.players[client.username];
        var value = data.blind_value;
        log(client.username + ' make blind changed into value : ' + value);
        if(player.table){
            var result = player.table.changeBlind(player, value);
        }
        if(result)
        {
            broadcastTable(util.EMIT_CHANGE_BLIND, {type: 1, value: value}, player.table, player);
        }
        
        client.emit(util.EMIT_CHANGE_BLIND, {type: 0, result: result, value: value});
    });

    // host start match
    client.on(util.EMIT_START_MATCH, function() {
        var host = game.players[client.username];
        var table = host.table;
        var result = table.startMatch(host);

//        client.emit(util.EMIT_START_MATCH, {type: 0, result: result});

        if (result == 1) {
            var data = {};
            data['type'] = 1;
            var players = [];
            table.players.forEach(function(element) {
                var player = {};
                player['username'] = element.username;
                player['playing_chip'] = element.playing_chip;
                player['total_bet'] = element.current_bet;
                player['slot'] = element.slot;
                players.push(player);
            });
            data['players'] = players;
            data['total_bet'] = table.total_chip;

            broadcastTable(util.EMIT_START_MATCH, data, table);

//            data = table.deal_card();
//            var current_turn = table.current_turn;
//            data['turn'] = current_turn;
//            broadcastCardInMatch(util.EMIT_DEAL_CARD, data, table);
            dealCard(table);

            newTurnOfPlayer(table);
        }
    });

    // user beat
    client.on(util.EMIT_BEAT_MATCH, function(data){
        var player = game.players[client.username];
        if(player.table.state == util.TABLE_STATE_WAITING) return;
        var result = {type: -1, content: 'extremely wrong'};
        switch(data.type){
            case util.BEAT_ALL_IN:
            {
                log(' player [' + player.username + '] beat [' + util.getNameBeat(data.type) + ']');
                result = player.table.beat_all_in(player);
            }
            break;
            case util.BEAT_CHECK:
            {
                log(' player [' + player.username + '] beat [' + util.getNameBeat(data.type) + ']');
                result = player.table.beat_check(player);
            }
            break;
            case util.BEAT_FOLD:
            {
                log(' player [' + player.username + '] beat [' + util.getNameBeat(data.type) + ']');
                result = player.table.beat_fold(player);
            }
            break;
            case util.BEAT_RAISE:
            {
                log(' player [' + player.username + '] beat [' + util.getNameBeat(data.type) + '] value [' + data.value + ']');
                result = player.table.beat_raise(player, parseInt(data.value));
//                log(' - raise value : ' + data.value);
            }
            break;
            case util.BEAT_CALL:
            {
                log(' player [' + player.username + '] beat [' + util.getNameBeat(data.type) + ']');
                result = player.table.beat_call(player);
            }
            break;
//            case util.BEAT_BET:
//            {
//                result = player.table.beat_bet(player, data.value);
//            }
//            break;
        }

        if(result['type'] == -3 && data.type != util.BEAT_ALL_IN){
            data.type = util.BEAT_ALL_IN;
            log(' player [' + player.username + '] beat [' + util.getNameBeat(data.type) + ']');
            result = player.table.beat_all_in(player);
//            log('player play as all - in with result is : ' + result['content']);
        }

        log(' # player [' + player.username + '] beat [' + util.getNameBeat(data.type) + '] with result >>' + result['content']);

        // nếu player đi nước hợp lệ
        if(result['type'] >= 0){
            if(player.table.timeOutInterval){
                log('clear interval for time out wth player ' + player.username);
                clearInterval(player.table.timeOutInterval);
            }
            // set cho player này đã đi xong lượt
            player.hasCompleteTurn = true;

            broadcastTable(util.EMIT_BEAT_MATCH
                , {total_bet: player.current_bet, slot: player.slot, playing_chip: player.playing_chip} , player.table);
//            broadcastTable(util.EMIT_BEAT_MATCH, {type: 1, beat_type: data.type, username: player.username, value: result}
//                , player.table, player.username);
//            client.emit(util.EMIT_BEAT_MATCH, {type: 0, beat_type: data.type, value: result});


//            log('EMIT_BEAT_MATCH - find new slot : ');
//            var slot_can_play = player.table.findSlotForPlay(player.table.slot_can_play);

            processTable(player.table);
        }else{
            log_error('player beats wrong value: beat [' + util.getNameBeat(data.type)
                + '] value [' + result['type'] + '] - current game turn : ' + player.table.current_turn);
        }
    });

    client.on(util.EMIT_GET_CHIP, function(data){
        if(data.value < 100) return;
        var player = game.players[client.username];
//        var table = player.table;

        if(player.state == util.PLAYER_STATE_WAITING){
            var loaded_chip = player.loadChipToPlay(data.value);
//            if(loaded_chip > 0)
//              db_connector.query('INSERT INTO log_chip VALUES(?,?,NOW())', [player.id, -loaded_chip]);
//                db_connector.query('INSERT INTO public.log_chip VALUES($1, $2, CURRENT_TIMESTAMP)', [player.id, -loaded_chip]);

            client.emit(util.EMIT_GET_CHIP, {value: loaded_chip});
            responsePersonalInfo(client, player);

            if(player.table){
                broadcastTable(util.EMIT_PLAYING_CHIP, {slot: player.slot, chip: player.playing_chip}, player.table);
            }
        }
    });

    client.on(util.EMIT_RETURN_CHIP, function(data){
        if(data.value < 0) return;
        var player = game.players[client.username];

        if(player.state == util.PLAYER_STATE_WAITING){
            var returned_chip = player.returnChip(data.value);
//            if(returned_chip > 0){
//                db_connector.query('INSERT INTO log_chip VALUES(?,?,NOW())', [player.id, returned_chip]);
//                db_connector.query('INSERT INTO public.log_chip VALUES($1, $2, CURRENT_TIMESTAMP)', [player.id, returned_chip]);
//            }

            client.emit(util.EMIT_RETURN_CHIP, {value: returned_chip});
            responsePersonalInfo(client, player);

            if(player.table){
                broadcastTable(util.EMIT_PLAYING_CHIP, {slot: player.slot, chip: player.playing_chip}, player.table);
            }
        }
    });

    /*
        ADMIN MESSAGE
     */
    client.on(util.EMIT_ADMIN_STATISTICS, function(data){
        console.log('is admin ' + client.isAdmin);
        if(client.isAdmin){
//            var query = db_connector.query("SELECT name, chip_amount, created_date" +
//                " FROM public.log_chip INNER JOIN public.user ON id = user_id " +
//                " WHERE name = $1 and type <> 1", [data.username]);

            var accounts = [];
            var acc = {};
//            query.on('row', function(result){
////                console.log(result);
//                acc = {};
//                acc['name'] = result.name;
//                acc['chip'] = result.chip_amount;
//                acc['created_date'] = result.created_date;
//                accounts.push(acc);
//            });

//            query.on('end', function() {
//                client.emit(util.EMIT_ADMIN_STATISTICS, {accounts : accounts});
//            });
        }
    });

    client.on(util.EMIT_ADMIN_HISTORY, function(data){
        console.log('is admin ' + client.isAdmin);
        if(client.isAdmin){
//            var query = db_connector.query("SELECT name, started_time, host_name, win_order, win_chips " +
//                "FROM public.user " +
//                "INNER JOIN (" +
//                    "SELECT user_id, table_id, started_time, host_name, win_order, win_chips " +
//                    "FROM public.user_history " +
//                    "INNER JOIN public.log_match " +
//                    "ON table_id = table_played ) as C " +
//                "ON id = user_id WHERE name = $1 and type <> 1", [data.username]);

            var accounts = [];
            var acc = {};
//            query.on('row', function(result){
////                console.log(result);
//                acc = {};
//                acc['name'] = result.name;
//                acc['time'] = result.started_time;
//                acc['host_name'] = result.host_name;
//                acc['win_order'] = result.win_order;
//                acc['win_chips'] = result.win_chips;
//                accounts.push(acc);
//            });

//            query.on('end', function() {
//                client.emit(util.EMIT_ADMIN_HISTORY, {accounts : accounts});
//            });
        }
    });

    client.on(util.EMIT_ADMIN_ACCOUNT, function(data){
        console.log('is admin ' + client.isAdmin);
//        if(client.isAdmin){
//            console.log('responseAccountList');
//            responseAccountList(client);
//        }
    });

    client.on(util.EMIT_ADMIN_ACOUNT_TREAT, function(data){
        console.log('is admin ' + client.isAdmin);
        if(client.isAdmin){
            if(data.type == 0){
//                db_connector.query("UPDATE public.user SET active = false WHERE name = $1 AND type <> 1", [data.username]);
//                responseAccountList(client);
            }else if(data.type == 1){
//                db_connector.query("UPDATE public.user SET active = true WHERE name = $1 AND type <> 1", [data.username]);
//                responseAccountList(client);
            }
        }
    });

});

function responseAccountList(client){
//    var query = db_connector.query("SELECT * FROM public.user WHERE type <> 1");

    var accounts = [];
    var acc = {};
//    query.on('row', function(result){
////        console.log(result);
//        acc = {};
//        acc['name'] = result.name;
//        acc['last_login'] = result.last_login;
//        acc['last_logout'] = result.last_logout;
//        acc['active'] = result.active;
//        accounts.push(acc);
//    });
//
//    query.on('end', function() {
//        client.emit(util.EMIT_ADMIN_ACCOUNT, {accounts : accounts});
//    });
}

//
// Handle match in table
//

function newTurnOfPlayer(table){
//    var responseNewTurn = setInterval(function(){
    try{
        var slot_can_play = table.slot_can_play;
        log('newTurnOfPlayer >> slot can play: ' + slot_can_play);
        var stage;
        broadcastTable(util.EMIT_CURRENT_TURN,
            {type: 1, username: table.players[slot_can_play].username, slot: slot_can_play
                , game_bet: table.current_bet, time_out: game.TURN_TIME_OUT},
            table, table.players[slot_can_play].username);

        var diff =  table.current_bet - table.players[slot_can_play].current_bet;
        
        if(diff == 0){
            stage = util.STAGE_PLAY_CHECK;
        }else if(diff >= table.players[slot_can_play].playing_chip){
            stage = util.STAGE_PLAY_ALL_ONLY;
            diff = table.players[slot_can_play].playing_chip;
        }else{
            stage = util.STAGE_PLAY_NORMAL;
        }

        table.players[slot_can_play].client.emit(util.EMIT_CURRENT_TURN,
            {type: 0 , game_bet: table.current_bet, blind: table.blind, time_out: game.TURN_TIME_OUT
                , stage: stage, call_value: diff, slot: slot_can_play });
//        clearInterval(responseNewTurn);
//    }, 2000);

    if(table.timeOutInterval){
        clearInterval(table.timeOutInterval);
    }
    
        table.timeOutInterval = setInterval(function(){
                if(table.timeOutInterval){
                    clearInterval(table.timeOutInterval);
                }
            if(table.players[slot_can_play] && table.players[slot_can_play].hasCompleteTurn == false){
                // if he don't play before time out
                // assume this player who can play, choose fold.
                table.players[slot_can_play].state = util.PLAYER_STATE_WAITING;
            }
            processTable(table);

        }, game.TURN_TIME_OUT);
    }catch(exception){}
}

function processTable(table){

    // tìm slot kế tiếp có thể tố
	var slot_can_play = table.findSlotForPlay(table.slot_can_play);
    var player_count = table.getPlayingPlayerCount();

	if(slot_can_play == -1 || player_count <= 1){
		log('match turn is : ' + table.current_turn);
		log('process next turn >>>>');
		var playable_player_count = table.getPlayablePlayerCount();
        do{
            log('playable_player_count : ' + playable_player_count);
            log('player_count : ' + player_count);
            table.processNextTurn();
            log('match turn after process is : ' + table.current_turn);
            if (table.current_turn < util.TURN_SHOW_DOWN && player_count > 1) {
                dealCard(table);
            } else break;

        }while(playable_player_count <= 1)

		if (table.current_turn >= util.TURN_SHOW_DOWN ||  player_count <= 1){
            log('going to end of match.\n Now calculating result of match....');
            table.state = util.TABLE_STATE_WAITING;

			var hasWinner = table.calculateResult();
            if(hasWinner){
                var winners = table.getWinners();
                var player_cards_list = [];
                var hand_card;
                table.players.forEach(function(element){
                    hand_card = {};
                    if(element.state == util.PLAYER_STATE_PLAYING){
                        hand_card['slot'] = element.slot;
                        hand_card['cards'] = element.cards;
                        player_cards_list.push(hand_card);
                        element.state = util.PLAYER_STATE_WAITING;
                    }
                });
                var content;
                if(player_count == 1){
                    winners[0].content = 'All fold';
                }

                broadcastTable(util.EMIT_RESULT_MATCH, {type: 1, winners: winners, other_hand_cards: player_cards_list}, table);
                var players = [];
                var p;
                winners.forEach(function(element){
                    p = {};
                    p['slot'] = element.slot;
                    p['chip'] = element.playing_chip;
                    players.push(p);
                    responseEventLog(element.username, " thắng " + element.chip_win + " chip!", util.STYLE_WHITE, table);
                });
                broadcastTable(util.EMIT_PLAYING_CHIP, {players: players} , table);
//                broadcastTable(util.EMIT_RESULT_CONTENT, {winners: winners}, table);
            }

			table.saveMatchLog(db_connector);
            log('End of match');

            // delay for refresh table
            table.timeOutInterval = setInterval(function(){
                if(table.timeOutInterval){
                    clearInterval(table.timeOutInterval);
                }
                if(table.host_player){
                    broadcastPlayerInTable(util.EMIT_REFRESH_TABLE, {type: 1}, table.players, table.host_player.username);
                    broadcastPlayerInTable(util.EMIT_REFRESH_TABLE, {type: 2}, table.viewers, table.host_player.username);
                    table.host_player.client.emit(util.EMIT_REFRESH_TABLE, {type: 0});
                }else{
                    broadcastPlayerInTable(util.EMIT_REFRESH_TABLE, {type: 1}, table.players);
                    broadcastPlayerInTable(util.EMIT_REFRESH_TABLE, {type: 2}, table.viewers);
                }

            }, game.REFRESH_TABLE_TIMEOUT);
		}else{
            if (!(table.players[table.slot_can_play]
                    && table.players[table.slot_can_play].state == util.PLAYER_STATE_PLAYING
                    && table.players[table.slot_can_play].playing_chip != 0))
            {
                table.slot_can_play = table.findSlotForPlay(table.slot_can_play);
            }
//            dealCard(table);
            newTurnOfPlayer(table);
            broadcastTable(util.EMIT_POT_LIST, {pot_list: table.pots}, table);
        }
	}else{
		table.slot_can_play = slot_can_play;
		newTurnOfPlayer(table);
	}
}

function dealCard(table){
    log('deal card for turn : ' + table.current_turn);
    var data = table.deal_card();
//    log('deal card for turn : ' + table.current_turn);
    data['turn'] = table.current_turn;
    broadcastCardInMatch(util.EMIT_DEAL_CARD, data, table);
}

//
// Broadcast
//
function broadcastTable(emit_name, data, table, excepted_username){
    broadcastPlayerInTable(emit_name, data, table.players, excepted_username);
    broadcastPlayerInTable(emit_name, data, table.viewers, excepted_username);
}

function broadcastPlayerInTable(emit_name, data, playerArray, excepted_username){
        playerArray.forEach( function(player){
        if(player){
            if(excepted_username == undefined){
                log('broadcast ' + emit_name + ' to player ' + player.username);
                player.client.emit(emit_name, data);
            }else{
                if (player.username != excepted_username) {
                    log('broadcast ' + emit_name + ' to player ' + player.username);
                    player.client.emit(emit_name, data);
                }
            }
        }
    });
}

function broadcastCardInMatch(emit_name, data, table){

    switch(data['turn'])
    {
        case util.TURN_DEAL_IN_HAND:
        {
            //broadcast players
            table.players.forEach(function(element){
                var value = {};
                value['type'] = 0;
                value['turn'] = data['turn'];
                value['slot'] = element.slot;
                value['card'] = data[element.slot];

                element.client.emit(emit_name, value);
            });

            //broadcast viewers
            table.viewers.forEach(function(element){
                var value = {};
                value['type'] = 1;
                value['turn'] = data['turn'];
                element.client.emit(emit_name, value);
            });
        }
        break;
        case util.TURN_THREE_CARD:
        case util.TURN_FOURTH_CARD:
        case util.TURN_FIFTH_CARD:
        {
            data['type'] = 0;
            broadcastTable(emit_name, data, table);
        }
        break;
    }
}

function broadcastInGame(emit_name, data, players, only_in_lobby, excepted_username){
    for(var username in players){

        if(only_in_lobby && game.players[username].location != game.LOCATION_LOBBY)
            continue;

        if(players[username].client){
            if(excepted_username == undefined){
                    log('broadcast ' + emit_name + ' to player ' + username);
                    players[username].client.emit(emit_name, data);

            }else{
                if(username != excepted_username && game.players[username].client){
                    log('broadcast ' + emit_name + ' to player ' + username);
                    players[username].client.emit(emit_name, data);
                }
            }
        }
    }
}

//
// Response message
//
function responsePersonalInfo(client, player){
    client.emit(util.EMIT_PERSONAL_INFO, {username: player.username, chip: player.chip});
}

function responseListTables(client){
    var data = {};
    data['table_number'] = game.table_number;
    for(var table_id in game.tables){
        var table = {};
        table['id'] = table_id;
        table['state'] = game.tables[table_id].state;

        if(game.tables[table_id].host_player)
            table['host'] = game.tables[table_id].host_player.username;
        else
            table['host'] = 'none';

        table['blind'] = game.tables[table_id].blind;
        table['max_blind'] = game.MAX_BLIND;
        table['player_number'] = game.tables[table_id].player_number;
        
      log('Table ' + table.id
          + ' have state ' + table.state
          + ' host is ' + table.host);
        data[table_id] = table;
    }

    if(client){
        client.emit(util.EMIT_TABLE_LIST, data);
    }else{
        broadcastInGame(util.EMIT_TABLE_LIST, data, game.players, true);
    }
}

function responseEventLog(actor_name, text, style, table){
    if(table){
        broadcastTable(util.EMIT_EVENT_LOG, {username: actor_name, text: text, style: style }, table);
    }
    else{
        broadcastInGame(util.EMIT_EVENT_LOG, {username: actor_name, text: text, style: style }, game.players, false);
    }
}

//function responseLobbyPLayers(client){
//    var data = {};
//    for( var username in game.players){
//        if(game.players[username].location == game.LOCATION_LOBBY){
//            var player = {};
//            player['username'] = username;
//            player['']
//        }
//    }
//}

function log(message){
    console.log('');
	console.log(message);
	console.log('');
}

function log_error(message){
    log(' >> ERROR: ' + message);
}

function log_warning(message){
    log('* Warning: ' + message);
}
