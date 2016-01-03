var MyUtil = (function () {
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
    zerofill:       zerofill,
    isTodayHoliday: isTodayHoliday,
    repeat:         repeat,
  };
})();
