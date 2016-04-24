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
    var now_date = Utilities.formatDate(date, 'Asia/Tokyo', 'yyyyMMddHHmm');
    var now_d    = Utilities.formatDate(date, 'Asia/Tokyo', 'dd');
    var now_time = Utilities.formatDate(date, 'Asia/Tokyo', 'HHmm');
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

      // 日時をパースする
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
        MailApp.sendEmail(config.admin_mail, 'メールキューにモード設定の不明な予定があります', row[config.column.body]);
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
