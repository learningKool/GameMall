

exports.util = {
        EMIT_REGISTRY_ACCOUNT  : 'registry_account'
    ,   EMIT_LOGIN          : 'login_account'
    ,   EMIT_PERSONAL_INFO  : 'personal_info'
    ,   EMIT_LOBBY_PLAYERS  : 'lobby_player'
    ,   EMIT_LEAVE_LOBBY    : 'leave_lobby'
    ,   EMIT_JOIN_LOBBY     : 'join_lobby'
    ,   EMIT_TABLE_LIST     : 'table_list'
    ,   EMIT_CREATE_TABLE   : 'create_table'
    ,   EMIT_JOIN_TABLE     : 'join_table'
    ,   EMIT_LEAVE_TABLE    : 'leave_table'
    ,   EMIT_HOST_CHANGE    : 'host_change'
    ,   EMIT_EVENT_LOG      : 'event_log'
    ,   EMIT_CHANGE_SLOT    : 'change_slot'
    ,   EMIT_KICK_PLAYER    : 'kick_player'
    ,   EMIT_CHANGE_BLIND   : 'change_blind'
    ,   EMIT_GET_CHIP       : 'get_chip'
    ,   EMIT_RETURN_CHIP    : 'return_chip'
    ,   EMIT_PLAYING_CHIP   : 'playing_chip'
    ,   EMIT_JOIN_MATCH     : 'join_match'
    ,   EMIT_BE_VIEWER      : 'be_viewer'
    ,   EMIT_UPDATE_N_PLAYER: 'update_number_player'
    ,   EMIT_START_MATCH    : 'start_match'
    ,   EMIT_CHAT_IN_TABLE  : 'chat_in_table'
    ,   EMIT_QUIT_MATCH     : 'quit_match'
    ,   EMIT_BEAT_MATCH     : 'beat_match'
    ,   EMIT_CURRENT_TURN   : 'current_turn'
    ,   EMIT_DEAL_CARD      : 'deal_card'
    ,   EMIT_POT_LIST       : 'pot_list'
    ,   EMIT_RESULT_MATCH   : 'result_match'
    ,   EMIT_RESULT_CONTENT : 'result_content'
    ,   EMIT_REFRESH_TABLE  : 'refresh_table'
    
    ,   PLAYER_STATE_WAITING: 0
    ,   PLAYER_STATE_PLAYING: 1

    ,   TABLE_STATE_WAITING : 0
    ,   TABLE_STATE_PLAYING : 1

    ,   BEAT_NONE           : -1
    ,   BEAT_FOLD           : 1
    ,   BEAT_ALL_IN         : 2
    ,   BEAT_CHECK          : 3
    ,   BEAT_RAISE          : 4
    ,   BEAT_BET            : 5
    ,   BEAT_CALL           : 6

    ,   TURN_NONE           : 0
    ,   TURN_DEAL_IN_HAND   : 1
    ,   TURN_THREE_CARD     : 2
    ,   TURN_FOURTH_CARD    : 3
    ,   TURN_FIFTH_CARD     : 4
    ,   TURN_SHOW_DOWN      : 5

    ,   STAGE_WAITING_TURN  : 0 //
    ,   STAGE_PLAY_NORMAL   : 1 //call cho bằng tố hoặc fold
    ,   STAGE_PLAY_CHECK    : 2 //bằng tố - check hoặc fold, có thể call
    ,   STAGE_PLAY_ALL_ONLY : 3 //mức tố cao hơn chip đang có, fold hoặc all-in

    ,   STYLE_WHITE         : "white"
    ,   STYLE_ORANGE        : "orange"
    ,   STYLE_YELLOW        : "yellow"
    ,   STYLE_RED           : "red"
    ,   STYLE_VIOLET        : "violet"
    ,   STYLE_BLUE          : "blue"

    ,  getNameBeat           : function (beat_type){
        switch(beat_type){
            case this.BEAT_FOLD: return 'fold';
            case this.BEAT_ALL_IN: return 'all-in';
            case this.BEAT_CHECK: return 'check';
            case this.BEAT_RAISE: return 'raise';
            case this.BEAT_BET: return 'bet';
            case this.BEAT_CALL: return 'call';
        }
    }
};
