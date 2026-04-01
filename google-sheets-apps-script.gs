function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Basvurular');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Basvurular');
    sheet.appendRow([
      'timestamp',
      'ad_soyad',
      'unvan',
      'email',
      'telefon',
      'site_adi',
      'il',
      'ilce',
      'adres',
      'blok_yapisi',
      'aidat_yil',
      'aylik_aidat',
      'dukkan_aidat',
      'notlar'
    ]);
  }

  var p = e.parameter || {};
  sheet.appendRow([
    new Date(),
    p.ad_soyad || '',
    p.unvan || '',
    p.email || '',
    p.telefon || '',
    p.site_adi || '',
    p.il || '',
    p.ilce || '',
    p.adres || '',
    p.blok_yapisi || '',
    p.aidat_yil || '',
    p.aylik_aidat || '',
    p.dukkan_aidat || '',
    p.notlar || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
