// job =========================================================================
function jobMailQueue() {
  new MailQueue().exec(MailQueueConfig, new Date());
}

// class =======================================================================
var MailQueue = (function() {
  // constructor ---------------------------------------------------------------
  function MailQueue() {
  }

  // public --------------------------------------------------------------------
  function exec(config, date) {
    // 現在日時を取得する
    var now_date = Utilities.formatDate(date, 'Asia/Tokyo' , 'yyyyMMddHHmm');
    var now_d    = Utilities.formatDate(date, 'Asia/Tokyo' , 'dd');
    var now_time = Utilities.formatDate(date, 'Asia/Tokyo' , 'HHmm');
    var weekday  = date.getDay();
    var is_today_holiday = MyUtil.isTodayHoliday(date);                         // 祝日か
    var is_today_dayoff  = (0 == weekday || 6 == weekday || is_today_holiday);  // 土日祝日か

    // 全データを取得する
    var sheet    = SpreadsheetApp.openById(config.doc_id).getSheetByName(config.sheet_name);
    var data_arr = sheet.getDataRange().getValues();
    var delete_index_arr = [];
    for (var i in data_arr) {
      if (config.system_row > i) {
        continue; // システム行は飛ばす
      }

      // 必須項目を確認する
      var row = data_arr[i];
      if ('' === row[config.column.hi]) {
        MailApp.sendEmail(config.admin_mail, 'メールキューに日時設定の不明な予定があります', row[config.column.body]);
        continue;
      }

      // 停止条件を確認する
      var stop_mode = row[config.column.stop_mode];
      if (('dayoff' === stop_mode && is_today_dayoff) || ('holiday' === stop_mode && is_today_holiday)) {
        continue;
      }

      // 日付をパースする
      var ymd = row[config.column.ymd];
      if (MyUtil.isObjectType(ymd, 'Date')) {
        ymd = Utilities.formatDate(ymd, 'Asia/Tokyo', 'yyyy/MM/dd')
      }
      var hi = row[config.column.hi];
      if (MyUtil.isObjectType(hi, 'Date')) {
        hi = Utilities.formatDate(hi, 'Asia/Tokyo', 'HH:mm')
      }
      ymd = ymd.split('/');
      hi  = hi.split(':');

      // 条件を確認する
      var is_send = false;
      if ('' !== row[config.column.ymd]) {
        // 年月日モード
        var str = ymd[0] + MyUtil.zerofill(ymd[1], 2) + MyUtil.zerofill(ymd[2], 2) + MyUtil.zerofill(hi[0], 2) + MyUtil.zerofill(hi[1], 2);
        if (now_date === str) {
          // 年月日時分が一致するとき
          is_send = true;
          delete_index_arr.push(i * 1 + 1);
        }
      } else if ('' !== row[config.column.weekday]) {
        // 曜日モード
        var str = MyUtil.zerofill(hi[0], 2) + MyUtil.zerofill(hi[1], 2);
        if (now_time == str && null !== row[config.column.weekday].toString().match(new RegExp(weekday))) {
          // 時分と曜日が一致するとき
          is_send = true;
        }
      } else if ('' !== row[config.column.include_n]) {
        // nの付く日モード
        var include_n = row[config.column.include_n];
        if (1 < include_n.length) {
          // 二桁以上の数字であるとき
          var is_include = (include_n === now_d);           // 二桁とも一致するとき真
        } else {
          var is_include = (include_n === now_d.slice(-1)); // 一桁目が一致するとき真
        }

        var str = MyUtil.zerofill(hi[0], 2) + MyUtil.zerofill(hi[1], 2);
        if (now_time == str && is_include) {
          // 時分が一致し、nの付く日であるとき
          is_send = true;
        }
      } else {
        // 不明
        MailApp.sendEmail(config.admin_mail, 'メールキューにモード設定の不定な予定があります', row[config.column.body]);
      }

      // メールを送信する
      if (is_send) {
        SendMessage.exec(config.mode, row[config.column.subject], row[config.column.body], config);
      }
    }

    delete_index_arr.reverse();
    for (var j in delete_index_arr) {
      sheet.deleteRow(delete_index_arr[j]);
    }
  }

  MailQueue.prototype = {
    constructor: MailQueue,
    exec: exec,
  };

  return MailQueue;
})();

var MyUtil = (function () {
  // オブジェクトのタイプを判定する
  function isObjectType(obj, type) {
    return undefined !== obj && null !== obj && type === Object.prototype.toString.call(obj).slice(8, -1);
  }

  // 0埋め
  function zerofill(val, width) {
    val = val.toString();
    while (val.length < width) {
      val = '0' + val;
    }
    return val;
  }

  // 祝日判定を行なう
  function isTodayHoliday(date) {
    var cal = CalendarApp.getCalendarById('ja.japanese#holiday@group.v.calendar.google.com');
    if (0 < cal.getEventsForDay(date).length) {
      // "祝日カレンダー"の"今日"の予定にイベントがあるとき
      return true;
    }
    return false;
  }

  // 文字を繰り返す
  function repeat(str, num) {
    var ret = str;
    for (i = 1; i < num; i++) {
      ret += str;
    }
    return ret;
  }

  return {
    isObjectType:   isObjectType,
    zerofill:       zerofill,
    isTodayHoliday: isTodayHoliday,
    repeat:         repeat,
  };
})();

var SendMessage = (function() {
  // メッセージを送信する
  function exec(mode, subject, body, config) {
    switch (mode) {
      case 'mail':
        MailApp.sendEmail(config.mail, subject, body);
        break;

      case 'slack':
        new SlackWebHooks().send(
          config.slack.api_url,
          body,
          {
            channel:    subject,
            username:   config.slack.show_name,
            icon_emoji: config.slack.show_icon,
            link_names: 1,
          }
        );
        break;
    }
  }

  return {
    exec: exec,
  };
})();

var SlackWebHooks = (function() {
  // constructor ---------------------------------------------------------------
  function SlackWebHooks() {
  }

  // public --------------------------------------------------------------------
  function send(url, text, extend_payload) {
    // ペイロードを構築する
    var payload = {};
    if ('object' === typeof extend_payload) {
      payload = extend_payload;
    }
    payload.text = text;

    // UrlFetchのオプションを構築する
    var options = {
      method:  'post',
      payload: {
        payload: JSON.stringify(payload),
      },
    };

    // 送信する (リトライ付き)
    var i = 0;
    while (i++ < 5) {
      try {
        UrlFetchApp.fetch(url, options);
        break;
      } catch (e) {
        if (
             -1 !== e.message.indexOf('Exception: タイムアウト: ')
          || -1 !== e.message.indexOf('Exception: 予期しないエラー: ')
          || -1 !== e.message.indexOf('Exception: 使用できないアドレス: ')
        ) {
          // よくある例外は、5秒の待ちを挟んで再実行する
          Utilities.sleep(5000);
        } else {
          // よくない例外は、上に投げる
          throw e;
        }
      }
    }
  }

  SlackWebHooks.prototype = {
    constructor: SlackWebHooks,
    send: send,
  };

  return SlackWebHooks;
})();

// job =========================================================================
function jobReset() {
  new TeamManage(TeamManageConfig, new Date()).reset();
}

function jobMorning() {
  new TeamManage(TeamManageConfig, new Date()).morning();
}

function jobEvening() {
  new TeamManage(TeamManageConfig, new Date()).evening();
}

// class =======================================================================
var TeamManage = (function() {
  // constructor ---------------------------------------------------------------
  function TeamManage(config, date) {
    this.config = config;
    this.date   = date;
  }

  // private -------------------------------------------------------------------
  // 土日祝日であるかどうか
  function isTodayHoliday(date) {
    var weekday = date.getDay();
    return (0 == weekday || 6 == weekday || MyUtil.isTodayHoliday(date));
  }

  // public --------------------------------------------------------------------
  // 管理状態をリセットする
  function reset() {
    if (isTodayHoliday(this.date)) {
      return; // 土日祝日であればすぐさま終わる
    }

    var config   = this.config;
    var sheet    = SpreadsheetApp.openById(config.doc_id).getSheetByName(config.sheet_name);
    var user_arr = sheet.getDataRange().getValues();
    for (var i in user_arr) {
      if (config.system_row > i) {
        continue; // システム行は飛ばす
      }

      // 次回用セルを取得する
      var cell = sheet.getRange(i * 1 + 1, config.column.body_next * 1 + 1);

      // 前回用セルを次回用セルで上書きし、次回用セルを空にする
      sheet.getRange(i * 1 + 1, config.column.body * 1 + 1).setValue(cell.getValue());
      cell.setValue('');
    }

    // 処理状態を0にする
    sheet.getRange(config.morning.status_cell).setValue('0');
    sheet.getRange(config.evening.status_cell).setValue('0');
  }

  // 朝の作業予定
  function morning() {
    if (isTodayHoliday(this.date)) {
      return; // 土日祝日であればすぐさま終わる
    }

    var hhii   = Utilities.formatDate(this.date, 'Asia/Tokyo', 'HHmm'); // 現在日時を取得する
    var config = this.config;
    if (config.morning.start > hhii || config.morning.end < hhii) {
      return; // 処理時間でなければすぐさま終わる
    }

    var sheet = SpreadsheetApp.openById(config.doc_id).getSheetByName(config.sheet_name);
    if (255 == sheet.getRange(config.morning.status_cell).getValue()) {
      return; // 処理済みであればすぐさま終わる
    }

    // ユーザ情報を確認する
    var user_arr = sheet.getDataRange().getValues();
    var mail_body  = '';  // メール本文
    var empty_user = '';  // 空な人の名前
    for (var i in user_arr) {
      if (config.system_row > i) {
        continue; // システム行は飛ばす
      }

      var user = user_arr[i];
      if ('' == user[config.column.body]) {
        // 作業予定が空のとき
        empty_user += ', ' + user[config.column.name] + 'さん';  // 空な人の名前を取得する
      } else {
        if (undefined !== config.emoticon[user[config.column.status] * 1 - 1]) {
          var emo = config.emoticon[user[config.column.status] * 1 - 1];
        } else {
          var emo = config.emoticon_undefined;
        }

        // メール本文を作成する
        mail_body += user[config.column.name] + ' ' + emo + "\n" + user[config.column.body] + "\n\n";
      }
    }

    if ('' !== empty_user) {
      mail_body = '作業予定の入力をお願い致します' + empty_user + "\n" + config.doc_url;
    } else {
      sheet.getRange(config.morning.status_cell).setValue('255');
    }

    SendMessage.exec(config.mode, config.subject, mail_body, config);
  }

  // 夜の作業報告
  function evening() {
    if (isTodayHoliday(this.date)) {
      return; // 土日祝日であればすぐさま終わる
    }

    var hhii   = Utilities.formatDate(this.date, 'Asia/Tokyo', 'HHmm'); // 現在日時を取得する
    var config = this.config;
    if (config.evening.start > hhii) {
      return; // 処理時間でなければすぐさま終わる
    }

    var sheet       = SpreadsheetApp.openById(config.doc_id).getSheetByName(config.sheet_name);
    var status_cell = sheet.getRange(config.evening.status_cell);
    var status_val  = status_cell.getValue();
    if (255 == status_val) {
      return; // 処理済みであればすぐさま終わる
    }

    // ユーザ情報を確認する
    var user_arr = sheet.getDataRange().getValues();
    var mail_body  = '';  // メール本文
    var empty_user = '';  // 空な人の名前
    for (var i in user_arr) {
      if (config.system_row > i) {
        continue; // システム行は飛ばす
      }

      var user = user_arr[i];
      if ('' == user[config.column.body_next] && config.evening.end_count > status_val) {
        // 次回の作業予定が空のとき (n+1回目に強制終了させる目的で条件式を追加)
        empty_user += ', ' + user[config.column.name] + 'さん';  // 空な人の名前を取得する
      } else {
        // メール本文を作成する
        var name      = user[config.column.name];
        var next_body = user[config.column.body_next] || '<不明>';
        mail_body += name + ' ' + MyUtil.repeat('-', 20 - name.length * 2) + "\n" + user[config.column.body] + "\n↓\n" + next_body + "\n\n";
      }
    }

    if ('' !== empty_user) {
      mail_body = '本日/次回の作業内容の入力をお願い致します' + empty_user + "\n" + config.doc_url;
      status_cell.setValue(status_val * 1 + 1);
    } else {
      status_cell.setValue('255');
    }

    SendMessage.exec(config.mode, config.subject, mail_body, config);
  }

  TeamManage.prototype = {
    constructor: TeamManage,
    reset: reset,
    morning: morning,
    evening: evening,
  };

  return TeamManage;
})();

