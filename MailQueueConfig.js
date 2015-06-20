// config ======================================================================
var MailQueueConfig = {
  mail:       'to@gmail.com',
  admin_mail: 'to@gmail.com',
  doc_id:     'doc_id',
  sheet_name: 'メールキュー',
  system_row: 2,
  column: {
    ymd:       0,  // 年月日
    hi:        1,  // 時分
    weekday:   2,  // 曜日
    include_n: 3,  // nの付く日
    stop_mode: 4,  // 停止条件
    subject:   5,  // 件名
    body:      6,  // 本文
  },
};
