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
    var date = this.date;
    if (isTodayHoliday(this.date)) {
      return; // 土日祝日であればすぐさま終わる
    }

    var hhii   = Utilities.formatDate(date, 'Asia/Tokyo' , 'HHmm');  // 現在日時を取得する
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
    var date = this.date;
    if (isTodayHoliday(this.date)) {
      return; // 土日祝日であればすぐさま終わる
    }

    var hhii   = Utilities.formatDate(date, 'Asia/Tokyo' , 'HHmm');  // 現在日時を取得する
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
