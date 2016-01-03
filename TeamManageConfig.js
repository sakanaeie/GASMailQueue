// config ======================================================================
var TeamManageConfig = {
  mode:        'mail',
  mail:        'to@gmail.com',
  admin_mail:  'to@gmail.com',
  subject:     '件名',
  doc_url:     'https://goo.gl/hogefugapiyo',
  doc_id:      'doc_id',
  sheet_name:  '作業予定',
  system_row:  2,
  morning: {
    status_cell: 'B2',
    start:       '1000',
    end:         '1400',
  },
  evening: {
    status_cell: 'C2',
    start:       '1900',
    end_count:   3,
  },
  column: {
    name:      0, // 名前
    status:    1, // 体調
    body:      2, // 作業予定
    body_next: 3, // 次回の作業予定
  },
  emoticon: ['(rain)', ';(', ':|', ':D', '(sun)'],
  emoticon_undefined: '(devil)',
  slack: {
    api_url:   'URL',
    show_name: 'NAME',
    show_icon: 'ICON',
  },
};
