		// Create SocketIO instance
		var socket;
		var isConnectByRegister = false;
        var username_regis = "";
        var password_regis = "";
        var curr_table_id = "";
        
		function startCanvas() {
			var myCanvas = document.getElementById('canvas');
			game.init(myCanvas);
			State.login.init();
			game.currState = State.login;
			run();
//        window.setInterval(game.run, 1000/6);
		}
        function run() {
            requestAnimFrame(run);
            game.run();
        };
		// Sends a message to the server via sockets
		function sendMessageToServer(message) {
			if(socket){
                socket.emit('my_event', { my: message });
				    //socket.send(message);
				log('<span style="color:#888">Sending ' + message + ' to the server!</span>');
            }//socket.flushBuffer;
		}

		function disconnect(){
			if(socket.socket.connected){
				socket.disconnect();
                //socket = undefined;
			}
		}
		
		function reconnect(){
            if(!socket)
			{
                var host_str = http_url + ':' + port;
                socket = io.connect(
                    host_str
                );

                //socket.connect();

                // Add a connect listener
                socket.on('connect',function() {
//                    log('<span style="color:#000000;">Connect success to the server!</span>');
                    if(isConnectByRegister == true){
                        socket.emit(Util.EMIT_REGISTRY_ACCOUNT, {username: username_regis, password: password_regis});
                    }
                    else{
                        var txt_username = $('#tb_username').val();
                        var txt_password = $('#tb_password').val();
                        socket.emit(Util.EMIT_LOGIN, { username: txt_username, password: txt_password } );
                        $('#txt_notification_login').text('');
                    }
                });

                // Add a connect listener
                socket.on('message',function(data) {
                    log('Received a message from the server:  ' + data);
                });

                // Add a disconnect listener
                socket.on('disconnect',function() {
//                    log('<span style="color:#ff0000;">The client has disconnected!</span>');
//                    window.location.reload();
                    changePage(PAGE_LOBBY);
                });

                //
                // Custom event
                //
                socket.on(Util.EMIT_LOGIN, function(data){
                    if(data.type == 0){
                        if(data.result == -1){
							$('#txt_notification_login').text("Sai mật khẩu! Vui lòng nhập lại.");
                        }else if(data.result == -2){
                            $('#txt_notification_login').text("Tài khoản chưa được kích hoạt.");
                        }else if(data.result == 1){
							showLoginForm(false);
                            changePage(PAGE_LOBBY_LOG_IN);
							$('#txt_notification_login').text("");
							$('#login_btn_login_back').click();
                        }
                        return;
                    }

                    if(data.type == 1){
                        log('<span style="color:#777777;">' + data.username + ' log in game</span>');
                    }
                });

                socket.on(Util.EMIT_REGISTRY_ACCOUNT, function(data){
                    if(data.result == -1){
                        $('#txt_notification_regis').text("Tài khoản đã tồn tại");
//                        log('<span style="color:#99ff00;">Account exist!!</span>');
                    }else if(data.result == 1){
                        $('#txt_notification_regis').text("Đăng ký thành công");
//                        log('<span style="color:#777777;">Registry account success!!!</span>');
                    }
                        $('#tb_username_regis').val('');
                        $('#tb_pass_regis').val('');
                        $('#tb_re_pass_regis').val('');
                    disconnect();
                });

                socket.on(Util.EMIT_PERSONAL_INFO, function(data){
                    updatePersonalInfo(data.username, data.chip);
                });

                // user join lobby
                socket.on(Util.EMIT_JOIN_LOBBY, function(data){
                    if(data.type == 1){
                        log('<span style="color:#777777;">Player ' + data.username + ' joins lobby!</span>');
                    }
                });

                // user leave lobby
                socket.on(Util.EMIT_LEAVE_LOBBY, function(data){
                    if(data.type == 1){
                        log('<span style="color:#777777;">Player ' + data.username + ' leaves lobby!</span>');
                    }
                });

                // user create table
                socket.on(Util.EMIT_CREATE_TABLE, function(data){
                    if(data.result == 1){
                        changePage(PAGE_IN_GAME);
//                        $('.table-game').empty();
                        addPlayerInTable(data.username, "", data.chip, data.level, data.slot);
                        $('.pull-right.white.folk-money .orange').text(data.blind + '$');
                        $('.btn-join-match').hide();
                        $('.btn-startgame').show();
                        curr_table_id = data.table_id;
                        displayAllCheckItem(false);
                        appendAllChangeSlot();
                        removeChangeSlot(data.slot);
                    }else{
                        log('<span style="color:#99ff00;">Create table fail!!</span>');
                    }
                });

                // table list
                socket.on(Util.EMIT_TABLE_LIST, function(data){
					var length = data.table_number;
                    // log('<span style="color:#777777;">Table list with length is:' + data.table_number + '</span>');

					//var table_list = document.getElementsByClassName('jspPane');
                    var table_list = $('.content-list.t_active .jspContainer .jspPane');
                    table_list.children('.tr').remove();

                    for(var table_id in data){
                        if(table_id == 'table_number') continue;

						var new_table = document.createElement('div');
						new_table.className = "tr";
						new_table.id = /*'table_' + */data[table_id].id;
						var str_innerHTML = "<div class=\"td base_unit\"> $" + data[table_id].blind + " </div>"
											+ "<div class=\"td name\">" + data[table_id].host + "</div>"
											+ "<div class=\"td player_count\">"
												+ "<div class=\"";

                        str_innerHTML += getActualImageByNumberPlayer(data[table_id].player_number);

						str_innerHTML += "\"></div>"
											+ "</div>"
                                            + "<div class=\"td required\"> $" + data[table_id].max_blind + " </div>"
                                            + "<div class=\"td ext\">"
                                                + "<a onclick=\"joinTable(this);\"></a>"
                                            + "</div>";
                        new_table.innerHTML = str_innerHTML;
//						$('.t_active').appendChild(new_table);
                        table_list.append(new_table);
                        $('.content-list.t_active').jScrollPane();
                        // log('<span style="color:#777777;">Table ' + data[table].id
                                // + ' have state ' + data[table].state
                                // + ' host is ' + data[table].host + '</span>');
                    }
                });

                // user join table
                socket.on(Util.EMIT_JOIN_TABLE, function(data){
                    // result for join table
                    if(data.type == 0){
                        if(data.result == 1){
                            curr_table_id = data.table_id;
                            changePage(PAGE_IN_GAME);
                            var players = data.players;

                            for(var i = 0 ; i < players.length ; i++){
                                var p = players[i];
                                addPlayerInTable(p.username, "", p.chip, p.level, p.slot);
                            }
                            $('.btn-join-match').show();
                            $('.btn-startgame').hide();
                            $('.pull-right.white.folk-money .orange').text(data.blind + '$');
                            displayAllCheckItem(false);
                            appendAllChangeSlot();
                            hideAllChangeSlot();
                        }else{
//                            log('<span style="color:#99ff00;">Join Table Fail!!!</span>');
                        }
                        return;
                    }

                    // other player join table which you're in
                    if(data.type == 1){
//                        log('<span style="color:#777777;">' + data.player.location + ' ' + data.player.username + ' joins table!</span>');
                    }
                });

                // user leave table
                socket.on(Util.EMIT_LEAVE_TABLE, function(data){
                    if(data.type == 0){
                        if(data.result){
                            clearCardOnBoard();
                            clearPlayerOnTable();
                            clearCardOnSlot();
                            removeAllChangeSlot();
                            changePage(PAGE_LOBBY_LOG_IN);
                            curr_table_id = -1;
                        }
//                        else{
////                            log('<span style="color:#99ff00;">Leave Table Fail!!!</span>');
//                        }
                        return;
                    }

                    if(data.type == 1){
                        if(data.slot){
                            removePlayerInTable(data.slot);
                            showChangeSlot(data.slot);
                        }
                    }
                });

                socket.on(Util.EMIT_CHAT_IN_TABLE, function(data){
                    $('.chat-content .jspContainer .jspPane').append('<p><span class="chat-elm">' + data.sender + '</span> ' + data.text + '</p>');
                    $('.chat-content .jspContainer .jspPane').emotions({handle: "a#toggle", css: null});
//                    $('.chat-content').jScrollPane({autoReinitialise:true, stickToBottom:true});
                });

                socket.on(Util.EMIT_EVENT_LOG, function(data){
                    $('.log-box .jspContainer .jspPane').append('<p><span class="' + data.style + '">' + data.username + '</span> ' + data.text + '</p>');
//                    $('.log-box').scrollTo;
                });

                // host in table is changed
                socket.on(Util.EMIT_HOST_CHANGE, function(data){
                    log('<span style="color:#6666ff;">Host table now is' + data.host_name + '</span>');
                });

                // change slot
                socket.on(Util.EMIT_CHANGE_SLOT, function(data){
//                    if(data.type == 0){
//                        if(data.result >=0){
////                            log('<span style="color:#777777;">Your slot now is ' + data.result + '.</span>');
//                        }else{
////                            log('<span style="color:#99ff00;">You can not change slot!</span>');
//                        }
//                        return;
//                    }

//                    if(data.type == 1)
                    {
//                        log('<span style="color:#777777;">Player ' + data.username + ' change slot from '
//                                + data.old_slot + ' to ' + data.new_slot + '.</span>');
                        removePlayerInTable(data.old_slot);
                        showChangeSlot(data.old_slot);
                        hideChangeSlot(data.slot);
                        addPlayerInTable(data.username, "", data.chip, data.level, data.slot);
                    }
                });

                // host kicks user out of table
                socket.on(Util.EMIT_KICK_PLAYER, function(data){
                    if(data.type == 0){
                        if(data.result){
                            log('<span style="color:#777777;">Kick ' + data.username + ' success!</span>');
                        }else{
                            log('<span style="color:#99ff00;">Kick ' + data.username + ' fail!!!</span>');
                        }
                        return;
                    }

                    if(data.type == 1){
                        log('<span style="color:#777777;">Player ' + data.username + ' is kicked from table.</span>');
                        return;
                    }

                    if(data.type == 2){
                        log('<span style="color:#990000;">You are kicked from table.</span>');
//                        return;
                    }
                });

                // user join match
                socket.on(Util.EMIT_JOIN_MATCH, function(data){
                    if(data.type == 0){
                        if(data.result == 1){
                            addPlayerInTable(data.player.username, "", data.player.chip, data.player.level, data.player.slot);
                            $('.btn-join-match').hide();

                            for(var i = 0 ; i < 8 ; i++){
                                var player = $("#slot_" + i);
                                if(player.length == 0){
                                    showChangeSlot(i);
                                }
                            }
                        }
//                        else
//                            log('<span style="color:#99ff00;">Join match fail!</span>');
                        return;
                    }

                    if(data.type == 1){
                        addPlayerInTable(data.player.username, "", data.player.chip, data.player.level, data.player.slot);
                        hideChangeSlot(data.player.slot);
                    }
                });

                // user changes into viewer
                socket.on(Util.EMIT_BE_VIEWER, function(data){
                    if(data.type == 0){
                        if(data.result == 1){
                            log('<span style="color:#777777;">Now, you are viewer in table</span>');
                        }else{
                            log('<span style="color:#99ff00;">Can not be viewer!</span>');
                        }
                        return;
                    }

                    if(data.type == 1){
                        showChangeSlot(data.slot);
                    }
                });

                socket.on(Util.EMIT_UPDATE_N_PLAYER, function(data){
                    console.log(data);
                    $('#' + data.table_id + ' .td.player_count').children('div').removeAttr('class');
                    $('#' + data.table_id + ' .td.player_count').children('div')
                        .addClass(getActualImageByNumberPlayer(data.number_player));
                });
                
				socket.on(Util.EMIT_CHANGE_BLIND, function(data){
                    if(data.result){
                        $('.pull-right.white.folk-money .orange').text(data.value + '$');
                    }
                });

				socket.on(Util.EMIT_START_MATCH, function(data){
                    total_bet = 0;
//                    if(data.type == 0){
//                        if(data.result == 1){
//                            game.setState(State.deal_in_hand);
//                            displayAllCheckItem(true);
//                            showCheckItem(STAGE_WAITING_TURN);
//                            $('.btn-startgame').hide();
//                        }
////                        else if(data.result == -1)
////                            logMatch('<span style="color:#99ff00;">You\'re not host. Can not start match!!!</span>');
////                        else if(data.result == -2)
////                            logMatch('<span style="color:#99ff00;">Not Enough player to start match!!!</span>');
////                        else if(data.result == -3)
////                            logMatch('<span style="color:#99ff00;">Match is playing!!</span>');
//                        return;
//                    }

                    if(data.type == 1){
//                        game.setState(State.deal_in_hand);
                        removeAllChangeSlot();
                        displayAllCheckItem(true);
                        showCheckItem(STAGE_WAITING_TURN);
                        $('.btn-startgame').hide();

                        data['players'].forEach(function(element){
                            if(element.total_bet > 0){
                                addChipBet(element.total_bet, element.slot);
                                $("#slot_" + element.slot + ' .money span').text(parseChipToString(element.playing_chip));
                            }
                        });
                    }
                });

                var waitingTimeOut;
                var beginTime, endTime;
                var reqID;
                var prevSlot = -1;
                var WIDTH_BAR = 70;
                var current_w;
                var isCancelAnimation = false;
                socket.on(Util.EMIT_CURRENT_TURN, function(data){
                    if(prevSlot != -1){
                        $('#slot_' + prevSlot + ' .timeout_bar').css('width', 0);
                    }

                    waitingTimeOut = data.time_out;
                    prevSlot = data.slot;
                    beginTime = Date.now();
                    endTime = beginTime + waitingTimeOut;
                    isCancelAnimation = false;
//                    $('#slot_' + prevSlot + ' .timeout_bar').css('width', WIDTH_BAR);
//                    current_w = WIDTH_BAR;
                    waitingTimeOutCallback();
                    function waitingTimeOutCallback(){
                        reqID = requestAnimFrame(waitingTimeOutCallback);

                        if(!isCancelAnimation){
                            if(Date.now() == beginTime){
                                current_w = WIDTH_BAR;
                            }else{
                                current_w = Math.floor((waitingTimeOut - (Date.now() - beginTime))*WIDTH_BAR/waitingTimeOut);
                            }
                            $('#slot_' + prevSlot + ' .timeout_bar').css('width', current_w);
                        }
                    }
                    if(data.type == 0){
//                        logMatch('<span style="color:#777777;">Now is your turn with time out ' + data.time_out + '.</span>');
//                        logMatch('<span style="color:#777777;">Current game bet is ' + data.game_bet + '.</span>');
                        showCheckItem(data.stage);
                        if(data.call_value && data.call_value > 0){
                            $('.check-item.call #call').val(data.call_value);
                            $('.check-item.call #call').text('CALL $' + data.call_value);
                        }else{
                            $('.check-item.call #call').val('');
                            $('.check-item.call #call').text('CALL $');
                        }
                        updateSlider(data.blind);
                        return;
                    }

                    if(data.type == 1){
//                        logMatch('<span style="color:#333300;">Now is turn of ' + data.username + ' in slot ' + data.slot
//                                + ' with time out ' + data.time_out + '.</span>');
//                        logMatch('<span style="color:#777777;">Current game bet is ' + data.game_bet + '.</span>');
                        showCheckItem(STAGE_WAITING_TURN);
                        $('.check-item.call #call').val('');
                        $('.check-item.call #call').text('CALL');
                    }
                });

                var card_on_board = [];
                var total_bet = 0;
                socket.on(Util.EMIT_DEAL_CARD, function(data){
                    if(data.type == 0){ // if you are in playing
                        var str = 'Now, game turn is: ' + data.turn + '. ';
                        switch(data.turn){
                            case Util.TURN_DEAL_IN_HAND:
                                clearCardOnSlot(data.slot);
                                appendCardOnSlot(data.slot, data.card['1'], data.card['2']);
                                debug_text = 'Your card is: ' + data.card['1'] + ' and ' + data.card['2'] + '.';
                            break;
                            case Util.TURN_THREE_CARD:
                                appendCardOnBoard(data.board['1']);
                                appendCardOnBoard(data.board['2']);
                                appendCardOnBoard(data.board['3']);
                                    card_on_table_text = 'Card on table is: \n' + card_on_board[0]
                                            + ' \n ' + card_on_board[1]
                                            + ' \n ' + card_on_board[2] + '.';
                            break;
                            case Util.TURN_FOURTH_CARD:
                                appendCardOnBoard(data.board['1']);
                                card_on_table_text = 'Card on table is: \n' + card_on_board[0]
                                            + ' \n ' + card_on_board[1]
                                            + ' \n ' + card_on_board[2]
                                            + ' \n ' + card_on_board[3] + '.';
                            break;
                            case Util.TURN_FIFTH_CARD:
                                appendCardOnBoard(data.board['1']);
                                card_on_table_text = 'Card on table is: \n' + card_on_board[0]
                                            + ' \n ' + card_on_board[1]
                                            + ' \n ' + card_on_board[2]
                                            + ' \n ' + card_on_board[3]
                                            + ' \n ' + card_on_board[4] + '.';
                            break;
                        }
//                        logMatch('<span style="color:#777777;">' + str + '</span>');
                        return;
                    }

                    if(data.type == 1){ // if you are viewer
//                        logMatch('<span style="color:#333300;">Now, turn is: ' + data.turn + '.</span>');
                    }
                });

                socket.on(Util.EMIT_BEAT_MATCH, function(data){
//                    if(data.type == 0){
//
////                        logMatch('<span style="color:#777777;">You beat ' + data.beat_type + ' with value ' + data.value + '.</span>');
////                        logMatch('<span style="color:#0000cc;">Total bet in match is ' + total_bet + '.</span>');
//                        return;
//                    }

//                    if(data.type == 1)
                    {
                        addChipBet(data.total_bet, data.slot);
                        $("#slot_" + data.slot + ' .money span').text(parseChipToString(data.playing_chip));
//                        logMatch('<span style="color:#333300;">Player ' +  data.username + ' beat ' + data.beat_type
//                                + ' with value ' + data.value + '.</span>');
//                        logMatch('<span style="color:#0000cc;">Total bet in match is ' + total_bet + '.</span>');
                    }
                });

                socket.on(Util.EMIT_POT_LIST, function(data){
                        $('.chip_bet').remove();
                        var count = 0;
                        data.pot_list.forEach(function(element){
                            addPot(element.chip, count);
                            count++;
                        });
                });

                socket.on(Util.EMIT_RESULT_MATCH, function(data){
                    if(prevSlot != -1){
                        isCancelAnimation = true;
                        current_w = 0;
                        $('#slot_' + prevSlot + ' .timeout_bar').css('width', current_w);
                        prevSlot = -1;
                    }
                    
                    {// to other
//                        var best_cards = data.best_card;
                        showAllCards(data.other_hand_cards);
                        $('.card').toggleClass('disabled');
                        
                        displayAllCheckItem(false);
                        
                        data.winners.forEach(function(element){
                            showBestcards(element.best_cards);
                            showResultMatch(element.slot, element.content + '</br> +' + parseChipToString(element.chip_win));
                        });
                    }
                });

                socket.on(Util.EMIT_RESULT_CONTENT, function(data){
                });

                socket.on(Util.EMIT_REFRESH_TABLE, function(data){
                    clearCardOnBoard();
                    clearCardOnSlot();
                    clearResultMatch();
                    $('.chip_bet').remove();


                    if(data.type == 0 || data.type == 1){
                        for(var i = 0 ; i < 8 ; i++){
                            var player = $("#slot_" + i);
                            if(player.length == 0){
                                console.log(i);
                                showChangeSlot(i);
                            }
                        }
                    }
                    if(data.type == 0){ // host
//                        changePage(PAGE_IN_GAME);
                        $('.btn-join-match').hide();
                        $('.btn-startgame').show();
                        displayAllCheckItem(false);
                    }
                    else
                    if(data.type == 1){ // player in table
                        $('.btn-join-match').hide();
                        $('.btn-startgame').hide();
                        displayAllCheckItem(false);
                    }
                    else
                    if(data.type == 2){ // viewers in table
                        $('.btn-join-match').show();
                        $('.btn-startgame').hide();
                        displayAllCheckItem(false);
                    }
                });

				socket.on(Util.EMIT_RETURN_CHIP, function(data){
                    if(data.value <= 0){
                        $('#txt_notification_recharge').text('Bạn không đủ chip để trả cho hệ thống.');
                    }else{
                        $('#btn_recharge_back').click();
//                        log('<span style="color:#777777;">You return ' + data.value + ' for system!</span>');
                    }
                });

                socket.on(Util.EMIT_GET_CHIP, function(data){
                    if(data.value <= 0){
                        $('#txt_notification_recharge').text('Bạn đã hết chip để nạp.');
                    }else{
//                        log('<span style="color:#777777;">You got ' + data.value + ' chip!</span>');
                        $('#btn_recharge_back').click();
                    }
                });

				socket.on(Util.EMIT_PLAYING_CHIP, function(data){
                    if(!data.players){
                        $('#slot_' + data.slot + ' .money span').text(parseChipToString(data.chip));
                    }else{
                        data.players.forEach(function(element){
                            $('#slot_' + element.slot + ' .money span').text(parseChipToString(element.chip));
                        });
                    }
                });
//				socket.on('a', function(data){
//
//                })
            }
            else{
                disconnect();
                socket.socket.reconnect();
            }
		}

        function registryAccount(username, password){
            socket.emit(Util.EMIT_REGISTRY_ACCOUNT, {username: username, password: password});
        }

		// Outputs to console and list
		function log(message) {
			// var li = document.createElement('li');
			// li.innerHTML = message;
			// document.getElementById('message-list').appendChild(li);
		}

//        function logMatch(message){
//			var li = document.createElement('li');
//			li.innerHTML = message;
//			document.getElementById('match-list').appendChild(li);
//        }
        
        function createTable(){
            socket.emit(Util.EMIT_CREATE_TABLE);
        }

        function joinTable(object){
            var table_id = jQuery(object).parent().parent().attr('id');
//                 table_id = document.getElementById('tb_table_id').value;
//                if(table_id == '')
//                    table_id = 0;

            socket.emit(Util.EMIT_JOIN_TABLE, {table_id: table_id});
        }

        function returnChip(){
            var chip = document.getElementById('tb_chip_amount');
            socket.emit(Util.EMIT_RETURN_CHIP, {value: chip.value});
        }

        function getChip(value){
            if(value > 100){
                socket.emit(Util.EMIT_GET_CHIP, {value: value});
            }
        }

        function returnChip(value){
            if(value > 0)
                socket.emit(Util.EMIT_RETURN_CHIP, {value: value});
        }

        function changeSlot(slot){
            socket.emit(Util.EMIT_CHANGE_SLOT, {slot: slot});
        }

        function leftTable(){
            if(main_page == PAGE_IN_GAME){
                socket.emit(Util.EMIT_LEAVE_TABLE);
            }else{
                disconnect();
            }
        }

        function kickPlayer(){
            var kicked_player = document.getElementById('tb_player_be_kicked');
            socket.emit(Util.EMIT_KICK_PLAYER, {username: kicked_player.value});
        }

        function beViewer(){
            socket.emit(Util.EMIT_BE_VIEWER);
        }

        function joinMatch(){
            socket.emit(Util.EMIT_JOIN_MATCH);
        }
        
//        function setBlind(){
//            var blind_value = document.getElementById('tb_blind').value;
//            socket.emit(Util.EMIT_CHANGE_BLIND, {blind_value: blind_value});
//        }

        function startMatch(){
            socket.emit(Util.EMIT_START_MATCH);
        }

        function chatInTable(table_id, text){
            socket.emit(Util.EMIT_CHAT_IN_TABLE, {table_id: table_id, text: text});
        }

        function raise(value){
//            var value = document.getElementById('tb_raise_value').value;
            socket.emit(Util.EMIT_BEAT_MATCH, {type: Util.BEAT_RAISE, value: value});
        }

//        function bet(){
//            var value = document.getElementById('tb_raise_value').value;
//            socket.emit(Util.EMIT_BEAT_MATCH, {type: Util.BEAT_BET, value: value});
//        }

        function check(){
            socket.emit(Util.EMIT_BEAT_MATCH, {type: Util.BEAT_CHECK});
        }
        
        function fold(){
            socket.emit(Util.EMIT_BEAT_MATCH, {type: Util.BEAT_FOLD});
        }

        function setNextStep(type){
            
        }
        
        function all_in(){
            socket.emit(Util.EMIT_BEAT_MATCH, {type: Util.BEAT_ALL_IN});
        }

        function call(value){
            socket.emit(Util.EMIT_BEAT_MATCH, {type: Util.BEAT_CALL, value: value});
        }
