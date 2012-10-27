		// Create SocketIO instance
		var socket;
		var isConnectByRegister = false;
        var username_regis = "";
        var password_regis = "";
        var curr_table_id = "";

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

                // Add a connect listener
                socket.on('connect',function() {
                        var txt_username = $('.login-form #tb_username').val();
                        var txt_password = $('.login-form #tb_password').val();
                        socket.emit(util_admin.EMIT_LOGIN, { username: txt_username, password: txt_password } );
                        $('#txt_notification_login').text('');
                });

                // Add a connect listener
                socket.on('message',function(data) {
                    log('Received a message from the server:  ' + data);
                });

                // Add a disconnect listener
                socket.on('disconnect',function() {
//                    log('<span style="color:#ff0000;">The client has disconnected!</span>');
                    //window.location.reload();
                });

                //
                // Custom event
                //
                socket.on(util_admin.EMIT_LOGIN, function(data){
                        if(data.result == -1){
							$('#txt_notification_login').text("Sai mật khẩu! Vui lòng nhập lại.");
                        }else if(data.result == 1){
							$('#txt_notification_login').text("");
							$('.login-form').hide();
                            $('.admin-form').show();
                        }
                });

                socket.on(util_admin.EMIT_ADMIN_HISTORY, function(data){
                    var t_history = $('#t_history .content-list.t_active');
                    t_history.empty();
                    for(var i=0 ; i <  data.accounts.length ; i++)
                    {
                        var div_id = 'history_' + i;
                        var element = data.accounts[i];
                        t_history.append('<div class="trow line" id="' + div_id + '"></div>');
                        $('#' + div_id).append('<div class="td account">' + element.name +'</div>');
                        $('#' + div_id).append('<div class="td table-start-time">' + element.time +'</div>');
                        $('#' + div_id).append('<div class="td table-host">' + element.host_name +'</div>');
                        $('#' + div_id).append('<div class="td win-order">' + element.win_order +'</div>');
                        $('#' + div_id).append('<div class="td win-chip">' + element.win_chips +'</div>');
                    };
                    
                });
                socket.on(util_admin.EMIT_ADMIN_STATISTICS, function(data){
                    var t_statistics = $('#t_statistics .content-list.t_active');
                    t_statistics.empty();
                    for(var i=0 ; i < data.accounts.length ; i++)
                    {
                        var div_id = 'statistics_' + i;
                        var element = data.accounts[i];
                        t_statistics.append('<div class="trow line" id="' + div_id + '"></div>');
                        $('#' + div_id).append('<div class="td account">' + element.name +'</div>');
                        $('#' + div_id).append('<div class="td chip_amount">' + element.chip + '</div>');
                        $('#' + div_id).append('<div class="td date_time">' + element.created_date +'</div>');
                    };
                });
                socket.on(util_admin.EMIT_ADMIN_ACCOUNT, function(data){
                    var t_account = $('#t_account .content-list.t_active');
                    t_account.empty();
                    for(var i=0 ; i < data.accounts.length ; i++)
                    {
                        var div_id = 'account_' + i;
                        var element = data.accounts[i];
                        t_account.append('<div class="trow line" id="' + div_id + '"></div>');
                        $('#' + div_id).append('<div class="td account">' + element.name +'</div>');
                        $('#' + div_id).append('<div class="td last-login">' + element.last_login + '</div>');
                        $('#' + div_id).append('<div class="td last-logout">' + element.last_logout + '</div>');
                        $('#' + div_id).append('<a href="#none" class="td btn-action"></a>');
                        
                        if(element.active){
                            $('#' + div_id + ' .btn-action').attr('id', element.name);
                            $('#' + div_id + ' .btn-action').attr('class', 'td btn-action btn-block');
                        }else{
                            $('#' + div_id + ' .btn-action').attr('id', element.name);
                            $('#' + div_id + ' .btn-action').attr('class', 'td btn-action btn-active');
                        }
                    };
                    $('.btn-block').click(function(){
                        var name = this.id;
                        accountBlock(name);
                    });
        
                    $('.btn-active').click(function(){
                        var name = this.id;
                        accountActive(name);
                    });
                });
            }
            else{
                disconnect();
                socket.socket.reconnect();
            }
		}

        function getStatistics(username){
            socket.emit(util_admin.EMIT_ADMIN_STATISTICS, {username: username});
        }

        function getHistory(username){
            socket.emit(util_admin.EMIT_ADMIN_HISTORY, {username: username});
        }

        function accountList(){
            socket.emit(util_admin.EMIT_ADMIN_ACCOUNT);
        }

        function accountBlock(username){
            socket.emit(util_admin.EMIT_ADMIN_ACOUNT_TREAT, {type: 0, username: username});
        }

        function accountActive(username){
            socket.emit(util_admin.EMIT_ADMIN_ACOUNT_TREAT, {type: 1, username: username});
        }