/**
 * LUXSAVE - Google Apps Script
 * 
 * ISTRUZIONI:
 * 1. Crea un nuovo Google Sheets
 * 2. Vai su Estensioni > Apps Script
 * 3. Cancella tutto e incolla questo codice
 * 4. Salva (Ctrl+S)
 * 5. Seleziona "setupSpreadsheet" dal menu e clicca Esegui
 * 6. Autorizza quando richiesto
 * 7. Distribuisci > Nuova distribuzione > App web > Chiunque
 * 8. Copia l'URL nei file HTML
 */

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1460653071880159334/gvLic40YxD1BfM9Tp40jjr3-wU6lbVwaxmxvEkxOJVMCeHEpDblsONg63akvM_NFNiY6';

// ==================== SETUP ====================

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Elimina tutti i fogli esistenti tranne uno
  const sheets = ss.getSheets();
  
  // Crea i fogli nell'ordine giusto
  
  // 1. ORDINI
  let ordiniSheet = ss.getSheetByName('Ordini');
  if (!ordiniSheet) {
    ordiniSheet = ss.insertSheet('Ordini');
  }
  ordiniSheet.clear();
  ordiniSheet.getRange(1, 1, 1, 11).setValues([[
    'ID', 'Data', 'Servizio', 'Piano', 'Durata', 'Prezzo', 'Sconto', 'Totale', 'Discord ID', 'Note', 'Stato'
  ]]);
  ordiniSheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#00fff7').setFontColor('#000000');
  ordiniSheet.setFrozenRows(1);
  
  // 2. DISDETTE
  let disdetteSheet = ss.getSheetByName('Disdette');
  if (!disdetteSheet) {
    disdetteSheet = ss.insertSheet('Disdette');
  }
  disdetteSheet.clear();
  disdetteSheet.getRange(1, 1, 1, 6).setValues([[
    'ID', 'Data', 'Discord ID', 'Servizio', 'Motivo', 'Stato'
  ]]);
  disdetteSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ff006e').setFontColor('#ffffff');
  disdetteSheet.setFrozenRows(1);
  
  // 3. CODICI_SCONTO
  let codiciSheet = ss.getSheetByName('Codici_Sconto');
  if (!codiciSheet) {
    codiciSheet = ss.insertSheet('Codici_Sconto');
  }
  codiciSheet.clear();
  codiciSheet.getRange(1, 1, 1, 9).setValues([[
    'Codice', 'Percentuale', 'Data Inizio', 'Data Scadenza', 'Max Utilizzi', 'Utilizzi Attuali', 'Servizi', 'Creato il', 'Attivo'
  ]]);
  codiciSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#ffbe0b').setFontColor('#000000');
  codiciSheet.setFrozenRows(1);
  
  // 4. STATISTICHE (ultimo perché usa riferimenti agli altri fogli)
  let statsSheet = ss.getSheetByName('Statistiche');
  if (!statsSheet) {
    statsSheet = ss.insertSheet('Statistiche');
  }
  statsSheet.clear();
  
  // Etichette
  statsSheet.getRange('A1').setValue('📊 STATISTICHE LUXSAVE');
  statsSheet.getRange('A3').setValue('📦 ORDINI');
  statsSheet.getRange('A4').setValue('Totale Ordini');
  statsSheet.getRange('A5').setValue('Ordini In Attesa');
  statsSheet.getRange('A6').setValue('Ordini Completati');
  statsSheet.getRange('A7').setValue('Ordini Annullati');
  statsSheet.getRange('A9').setValue('💰 RICAVI');
  statsSheet.getRange('A10').setValue('Ricavi Totali');
  statsSheet.getRange('A11').setValue('Ricavi In Attesa');
  statsSheet.getRange('A13').setValue('🎟️ CODICI SCONTO');
  statsSheet.getRange('A14').setValue('Codici Attivi');
  statsSheet.getRange('A15').setValue('Codici Disattivati');
  statsSheet.getRange('A16').setValue('Totale Utilizzi');
  statsSheet.getRange('A18').setValue('❌ DISDETTE');
  statsSheet.getRange('A19').setValue('Totale Disdette');
  statsSheet.getRange('A20').setValue('Disdette In Attesa');
  statsSheet.getRange('A21').setValue('Disdette Elaborate');
  
  // Valori iniziali a 0 (senza formule per evitare errori)
  statsSheet.getRange('B4').setValue(0);
  statsSheet.getRange('B5').setValue(0);
  statsSheet.getRange('B6').setValue(0);
  statsSheet.getRange('B7').setValue(0);
  statsSheet.getRange('B10').setValue(0);
  statsSheet.getRange('B11').setValue(0);
  statsSheet.getRange('B14').setValue(0);
  statsSheet.getRange('B15').setValue(0);
  statsSheet.getRange('B16').setValue(0);
  statsSheet.getRange('B19').setValue(0);
  statsSheet.getRange('B20').setValue(0);
  statsSheet.getRange('B21').setValue(0);
  
  // Formattazione
  statsSheet.getRange('A1:B1').merge().setFontSize(18).setFontWeight('bold').setBackground('#00fff7').setFontColor('#000000').setHorizontalAlignment('center');
  statsSheet.getRange('A3:B3').merge().setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  statsSheet.getRange('A9:B9').merge().setFontWeight('bold').setBackground('#3bff85').setFontColor('#000000');
  statsSheet.getRange('A13:B13').merge().setFontWeight('bold').setBackground('#ffbe0b').setFontColor('#000000');
  statsSheet.getRange('A18:B18').merge().setFontWeight('bold').setBackground('#ff006e').setFontColor('#ffffff');
  
  statsSheet.setColumnWidth(1, 200);
  statsSheet.setColumnWidth(2, 150);
  
  // 5. UTILIZZI_CODICI (traccia chi usa quale codice)
  let utilizziSheet = ss.getSheetByName('Utilizzi_Codici');
  if (!utilizziSheet) {
    utilizziSheet = ss.insertSheet('Utilizzi_Codici');
  }
  utilizziSheet.clear();
  utilizziSheet.getRange(1, 1, 1, 5).setValues([[
    'Discord ID', 'Codice', 'Data Utilizzo', 'Ordine ID', 'Servizio'
  ]]);
  utilizziSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#9b5de5').setFontColor('#ffffff');
  utilizziSheet.setFrozenRows(1);
  
  // 6. RESTRIZIONI_CODICI (whitelist/blacklist/limiti per codice)
  let restrizioniSheet = ss.getSheetByName('Restrizioni_Codici');
  if (!restrizioniSheet) {
    restrizioniSheet = ss.insertSheet('Restrizioni_Codici');
  }
  restrizioniSheet.clear();
  restrizioniSheet.getRange(1, 1, 1, 5).setValues([[
    'Codice', 'Tipo Restrizione', 'Discord IDs (separati da virgola)', 'Max Utilizzi Per Utente', 'Data Creazione'
  ]]);
  restrizioniSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f72585').setFontColor('#ffffff');
  restrizioniSheet.setFrozenRows(1);
  
  // Riordina i fogli: Statistiche, Ordini, Disdette, Codici_Sconto, Utilizzi_Codici, Restrizioni_Codici
  statsSheet.activate();
  ss.moveActiveSheet(1);
  ordiniSheet.activate();
  ss.moveActiveSheet(2);
  disdetteSheet.activate();
  ss.moveActiveSheet(3);
  codiciSheet.activate();
  ss.moveActiveSheet(4);
  utilizziSheet.activate();
  ss.moveActiveSheet(5);
  restrizioniSheet.activate();
  ss.moveActiveSheet(6);
  
  // Elimina Foglio1 se esiste
  const foglio1 = ss.getSheetByName('Foglio1');
  if (foglio1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(foglio1); } catch(e) {}
  }
  
  // Torna a Statistiche
  statsSheet.activate();
  
  return { success: true, message: 'Setup completato!' };
}

// ==================== API ====================

function doGet(e) {
  try {
    const type = e.parameter.type;
    switch(type) {
      case 'get_stats': return jsonResponse(getStats());
      case 'get_orders': return jsonResponse(getOrders());
      case 'get_discounts': return jsonResponse(getDiscounts());
      case 'get_all_discounts': return jsonResponse(getDiscounts());
      case 'get_cancellations': return jsonResponse(getCancellations());
      case 'get_restrictions': return jsonResponse(getRestrictions());
      case 'get_usage': return jsonResponse(getAllUsage());
      case 'get_code_usage': return jsonResponse(getCodeUsage(e.parameter.code, e.parameter.discord_id));
      default: return jsonResponse({ error: 'Invalid type' });
    }
  } catch (error) {
    return jsonResponse({ error: error.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    let result;
    
    switch(data.type) {
      case 'new_order': result = addOrder(data); break;
      case 'update_order_status': result = updateOrderStatus(data.id, data.status); break;
      case 'mark_as_paid': result = markAsPaid(data.id); break;
      case 'delete_order': result = deleteOrder(data.id); break;
      case 'add_discount': result = addDiscount(data); break;
      case 'update_discount': result = updateDiscount(data); break;
      case 'delete_discount': result = deleteDiscount(data.code); break;
      case 'toggle_discount': result = toggleDiscount(data.code); break;
      case 'new_cancellation': result = addCancellation(data); break;
      case 'update_cancellation_status': result = updateCancellationStatus(data.id, data.status); break;
      case 'delete_cancellation': result = deleteCancellation(data.id); break;
      // Use discount con controllo utilizzi
      case 'use_discount': result = useDiscount(data.code, data.discord_id, data.service); break;
      // Gestione restrizioni codici
      case 'add_restriction': result = addRestriction(data); break;
      case 'delete_restriction': result = deleteRestriction(data.code); break;
      case 'get_code_usage': result = getCodeUsage(data.code, data.discord_id); break;
      default: result = { error: 'Invalid type' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ==================== STATISTICHE ====================

function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('Ordini');
  const discountsSheet = ss.getSheetByName('Codici_Sconto');
  
  if (!ordersSheet || !discountsSheet) {
    return { totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: '0.00', activeDiscounts: 0 };
  }
  
  const ordersData = ordersSheet.getDataRange().getValues().slice(1);
  const totalOrders = ordersData.length;
  const pendingOrders = ordersData.filter(r => r[10] === 'In attesa').length;
  const completedOrders = ordersData.filter(r => r[10] === 'Completato').length;
  const totalRevenue = ordersData.filter(r => r[10] === 'Completato').reduce((s, r) => s + (parseFloat(r[7]) || 0), 0).toFixed(2);
  
  const discountsData = discountsSheet.getDataRange().getValues().slice(1);
  const activeDiscounts = discountsData.filter(r => r[7] === 'SI').length;
  
  // Aggiorna foglio Statistiche
  const statsSheet = ss.getSheetByName('Statistiche');
  if (statsSheet) {
    statsSheet.getRange('B4').setValue(totalOrders);
    statsSheet.getRange('B5').setValue(pendingOrders);
    statsSheet.getRange('B6').setValue(completedOrders);
    statsSheet.getRange('B7').setValue(ordersData.filter(r => r[10] === 'Annullato').length);
    statsSheet.getRange('B10').setValue(parseFloat(totalRevenue));
    statsSheet.getRange('B11').setValue(ordersData.filter(r => r[10] === 'In attesa').reduce((s, r) => s + (parseFloat(r[7]) || 0), 0));
    statsSheet.getRange('B14').setValue(activeDiscounts);
    statsSheet.getRange('B15').setValue(discountsData.filter(r => r[7] === 'NO').length);
    statsSheet.getRange('B16').setValue(discountsData.reduce((s, r) => s + (parseInt(r[5]) || 0), 0));
    
    const cancSheet = ss.getSheetByName('Disdette');
    if (cancSheet) {
      const cancData = cancSheet.getDataRange().getValues().slice(1);
      statsSheet.getRange('B19').setValue(cancData.length);
      statsSheet.getRange('B20').setValue(cancData.filter(r => r[5] === 'In attesa').length);
      statsSheet.getRange('B21').setValue(cancData.filter(r => r[5] === 'Elaborata').length);
    }
  }
  
  return { totalOrders, pendingOrders, completedOrders, totalRevenue, activeDiscounts };
}

// ==================== ORDINI ====================

function getOrders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Ordini');
  if (!sheet) return { orders: [] };
  
  const data = sheet.getDataRange().getValues().slice(1);
  const orders = data.map(r => ({
    id: r[0], date: r[1], service: r[2], plan: r[3], duration: r[4],
    price: r[5], discount: r[6], total: r[7], discordId: r[8], notes: r[9], status: r[10]
  })).reverse();
  
  return { orders };
}

function addOrder(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Ordini');
  if (!sheet) return { success: false, error: 'Foglio non trovato' };
  
  const id = Date.now();
  const now = new Date();
  const date = now.toISOString();
  
  sheet.appendRow([
    id, date, data.service || '', data.plan || '', data.duration || '',
    data.price || 0, data.discount || '-', data.total || 0,
    data.discordId || '', data.notes || '', 'In attesa'
  ]);
  
  getStats();
  return { success: true, orderId: id };
}

function updateOrderStatus(id, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Ordini');
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 11).setValue(status);
      getStats();
      return { success: true };
    }
  }
  return { success: false };
}

// Segna ordine come pagato
function markAsPaid(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Ordini');
  if (!sheet) return { success: false, error: 'Foglio Ordini non trovato' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 11).setValue('Pagato');
      getStats();
      return { success: true };
    }
  }
  return { success: false, error: 'Ordine non trovato' };
}

function deleteOrder(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Ordini');
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      getStats();
      return { success: true };
    }
  }
  return { success: false };
}

// ==================== CODICI SCONTO ====================

function getDiscounts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Codici_Sconto');
  if (!sheet) return { discounts: [] };
  
  const data = sheet.getDataRange().getValues().slice(1);
  const discounts = data.map(r => ({
    code: r[0], percentage: r[1], startDate: r[2], expiry: r[3],
    maxUses: r[4], currentUses: r[5], services: r[6] || '-', created: r[7], active: r[8]
  }));
  
  return { discounts };
}

function addDiscount(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Codici_Sconto');
  if (!sheet) return { success: false };
  
  const created = new Date().toLocaleString('it-IT');
  const startDate = data.startDate || new Date().toLocaleDateString('it-IT');
  const services = data.services || '-'; // '-' = tutti i servizi
  
  sheet.appendRow([
    data.code.toUpperCase(), data.percentage, startDate, data.expiry,
    data.maxUses || 0, 0, services, created, 'SI'
  ]);
  
  getStats();
  return { success: true };
}

function updateDiscount(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Codici_Sconto');
  if (!sheet) return { success: false };
  
  const sheetData = sheet.getDataRange().getValues();
  for (let i = 1; i < sheetData.length; i++) {
    if (sheetData[i][0] === data.code) {
      sheet.getRange(i + 1, 2).setValue(data.percentage);
      sheet.getRange(i + 1, 3).setValue(data.startDate);
      sheet.getRange(i + 1, 4).setValue(data.expiry);
      sheet.getRange(i + 1, 5).setValue(data.maxUses);
      return { success: true };
    }
  }
  return { success: false };
}

function deleteDiscount(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Codici_Sconto');
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      sheet.deleteRow(i + 1);
      getStats();
      return { success: true };
    }
  }
  return { success: false };
}

function toggleDiscount(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Codici_Sconto');
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      const newStatus = data[i][7] === 'SI' ? 'NO' : 'SI';
      sheet.getRange(i + 1, 8).setValue(newStatus);
      getStats();
      return { success: true, newStatus };
    }
  }
  return { success: false };
}

function useDiscount(code, discordId, service) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const codiciSheet = ss.getSheetByName('Codici_Sconto');
  if (!codiciSheet) return { success: false, error: 'Foglio codici non trovato' };
  
  // Trova il codice
  const codiciData = codiciSheet.getDataRange().getValues();
  let codiceRow = -1;
  let percentuale = 0;
  let maxUtilizzi = 0;
  let utilizziAttuali = 0;
  
  for (let i = 1; i < codiciData.length; i++) {
    if (codiciData[i][0] === code) {
      codiceRow = i + 1;
      percentuale = codiciData[i][1];
      maxUtilizzi = codiciData[i][4] || 0;
      utilizziAttuali = codiciData[i][5] || 0;
      
      // Verifica se attivo
      if (codiciData[i][8] !== 'SI') {
        return { success: false, error: 'Codice non attivo' };
      }
      
      // Verifica max utilizzi globali
      if (maxUtilizzi > 0 && utilizziAttuali >= maxUtilizzi) {
        return { success: false, error: 'Codice esaurito (raggiunto limite utilizzi)' };
      }
      break;
    }
  }
  
  if (codiceRow === -1) {
    return { success: false, error: 'Codice non trovato' };
  }
  
  // ===== VERIFICA RESTRIZIONI PER UTENTE =====
  let hasSpecificRestriction = false; // Flag per sapere se c'è una restrizione specifica
  let maxUtilizziPersonalizzato = 1; // Limite personalizzato se esiste
  
  const restrizioniSheet = ss.getSheetByName('Restrizioni_Codici');
  if (restrizioniSheet) {
    const restrizioniData = restrizioniSheet.getDataRange().getValues();
    
    for (let i = 1; i < restrizioniData.length; i++) {
      if (restrizioniData[i][0] === code) {
        hasSpecificRestriction = true; // Trovata restrizione specifica!
        const tipoRestrizione = restrizioniData[i][1];
        const discordIds = (restrizioniData[i][2] || '').toString().split(',').map(id => id.trim()).filter(id => id !== '');
        maxUtilizziPersonalizzato = parseInt(restrizioniData[i][3]) || 1;
        
        // Whitelist: solo questi utenti possono usare il codice
        if (tipoRestrizione === 'whitelist') {
          if (discordIds.length > 0 && !discordIds.includes(discordId)) {
            return { success: false, error: 'Questo codice non è disponibile per il tuo account' };
          }
        }
        
        // Blacklist: questi utenti NON possono usare il codice
        if (tipoRestrizione === 'blacklist') {
          if (discordIds.includes(discordId)) {
            return { success: false, error: 'Questo codice non è disponibile per il tuo account' };
          }
        }
        
        // Per TUTTI i tipi: verifica quante volte l'utente ha già usato questo codice
        const utilizziSheetCheck = ss.getSheetByName('Utilizzi_Codici');
        if (utilizziSheetCheck) {
          const utilizziData = utilizziSheetCheck.getDataRange().getValues();
          let countUtilizziUtente = 0;
          
          for (let j = 1; j < utilizziData.length; j++) {
            if (utilizziData[j][0] === discordId && utilizziData[j][1] === code) {
              countUtilizziUtente++;
            }
          }
          
          if (countUtilizziUtente >= maxUtilizziPersonalizzato) {
            return { success: false, error: `Hai già utilizzato questo codice ${maxUtilizziPersonalizzato} volta/e` };
          }
        }
        
        break; // Trovata la restrizione, esci dal loop
      }
    }
  }
  
  // ===== VERIFICA UTILIZZO PRECEDENTE (solo se NON ci sono restrizioni specifiche) =====
  let utilizziSheet = ss.getSheetByName('Utilizzi_Codici');
  if (!utilizziSheet) {
    // Crea il foglio se non esiste
    utilizziSheet = ss.insertSheet('Utilizzi_Codici');
    utilizziSheet.getRange(1, 1, 1, 5).setValues([['Discord ID', 'Codice', 'Data Utilizzo', 'Ordine ID', 'Servizio']]);
    utilizziSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#9b5de5').setFontColor('#ffffff');
  }
  
  // Solo se NON c'è una restrizione specifica, applica il limite default
  if (!hasSpecificRestriction) {
    const utilizziData = utilizziSheet.getDataRange().getValues();
    let utilizziUtente = 0;
    
    for (let i = 1; i < utilizziData.length; i++) {
      if (utilizziData[i][0] === discordId && utilizziData[i][1] === code) {
        utilizziUtente++;
      }
    }
    
    // Default: 1 utilizzo per utente per codice
    const LIMITE_DEFAULT = 1;
    if (utilizziUtente >= LIMITE_DEFAULT) {
      return { success: false, error: 'Hai già utilizzato questo codice!' };
    }
  }
  
  // ===== REGISTRA UTILIZZO =====
  const orderId = 'ORDER-' + Date.now();
  const now = new Date();
  
  utilizziSheet.appendRow([
    discordId,
    code,
    now.toISOString(),
    orderId,
    service || 'N/A'
  ]);
  
  // Incrementa utilizzi nel codice
  codiciSheet.getRange(codiceRow, 6).setValue(utilizziAttuali + 1);
  
  return { 
    success: true, 
    percentage: percentuale,
    orderId: orderId,
    message: 'Codice applicato con successo!'
  };
}

// ==================== RESTRIZIONI CODICI ====================

function getRestrictions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Restrizioni_Codici');
  
  if (!sheet) {
    // Crea il foglio se non esiste
    sheet = ss.insertSheet('Restrizioni_Codici');
    sheet.getRange(1, 1, 1, 5).setValues([['Codice', 'Tipo Restrizione', 'Discord IDs (separati da virgola)', 'Max Utilizzi Per Utente', 'Data Creazione']]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f72585').setFontColor('#ffffff');
    return { restrictions: [] };
  }
  
  const data = sheet.getDataRange().getValues().slice(1);
  const restrictions = data.map(r => ({
    code: r[0],
    type: r[1],
    discordIds: r[2] ? r[2].toString().split(',').map(id => id.trim()) : [],
    maxUsesPerUser: r[3] || 1,
    createdAt: r[4]
  }));
  
  return { restrictions };
}

function addRestriction(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Restrizioni_Codici');
  
  if (!sheet) {
    sheet = ss.insertSheet('Restrizioni_Codici');
    sheet.getRange(1, 1, 1, 5).setValues([['Codice', 'Tipo Restrizione', 'Discord IDs (separati da virgola)', 'Max Utilizzi Per Utente', 'Data Creazione']]);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f72585').setFontColor('#ffffff');
  }
  
  // Verifica se esiste già una restrizione per questo codice
  const existingData = sheet.getDataRange().getValues();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === data.code) {
      // Aggiorna la riga esistente
      sheet.getRange(i + 1, 1, 1, 5).setValues([[
        data.code,
        data.restrictionType || data.type || 'limit',
        (data.discordIds || []).join(','),
        data.maxUsesPerUser || 1,
        existingData[i][4] // mantieni data creazione originale
      ]]);
      return { success: true, message: 'Restrizione aggiornata!' };
    }
  }
  
  // Aggiungi nuova riga
  sheet.appendRow([
    data.code,
    data.restrictionType || data.type || 'limit',
    (data.discordIds || []).join(','),
    data.maxUsesPerUser || 1,
    new Date().toISOString()
  ]);
  
  return { success: true, message: 'Restrizione aggiunta!' };
}

function deleteRestriction(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Restrizioni_Codici');
  if (!sheet) return { success: false, error: 'Foglio restrizioni non trovato' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === code) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Restrizione eliminata!' };
    }
  }
  
  return { success: false, error: 'Restrizione non trovata' };
}

function getAllUsage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Utilizzi_Codici');
  if (!sheet) return { usages: [] };
  
  const data = sheet.getDataRange().getValues();
  const usages = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) { // Skip empty rows
      usages.push({
        discordId: data[i][0] ? data[i][0].toString() : '',
        code: data[i][1] || '',
        date: data[i][2] || '',
        orderId: data[i][3] || '',
        service: data[i][4] || ''
      });
    }
  }
  
  return { usages };
}

function getCodeUsage(code, discordId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Utilizzi_Codici');
  if (!sheet) return { count: 0, usages: [] };
  
  const data = sheet.getDataRange().getValues();
  const usages = [];
  
  for (let i = 1; i < data.length; i++) {
    const matchCode = !code || data[i][1] === code;
    const matchUser = !discordId || data[i][0] === discordId;
    
    if (matchCode && matchUser) {
      usages.push({
        discordId: data[i][0],
        code: data[i][1],
        date: data[i][2],
        orderId: data[i][3],
        service: data[i][4]
      });
    }
  }
  
  return { count: usages.length, usages };
}

// ==================== DISDETTE ====================

function getCancellations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Disdette');
  if (!sheet) return { cancellations: [] };
  
  const data = sheet.getDataRange().getValues().slice(1);
  const cancellations = data.map(r => ({
    id: r[0], date: r[1], discordId: r[2], service: r[3], reason: r[4], status: r[5]
  })).reverse();
  
  return { cancellations };
}

function addCancellation(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Disdette');
  if (!sheet) return { success: false };
  
  const id = Date.now();
  const now = new Date();
  const date = now.toISOString();
  
  sheet.appendRow([id, date, data.discordId || '', data.service || '', data.reason || '', 'In attesa']);
  
  getStats();
  return { success: true, cancellationId: id };
}

function updateCancellationStatus(id, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Disdette');
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i + 1, 6).setValue(status);
      getStats();
      return { success: true };
    }
  }
  return { success: false };
}

function deleteCancellation(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Disdette');
  if (!sheet) return { success: false };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      getStats();
      return { success: true };
    }
  }
  return { success: false };
}

// ==================== DISCORD ====================

function sendDiscordNotification(type, data) {
  if (!DISCORD_WEBHOOK_URL) return;
  
  let embed;
  if (type === 'nuovo_ordine') {
    embed = {
      title: '🛒 Nuovo Ordine!', color: 65535,
      fields: [
        { name: 'ID', value: String(data.id), inline: true },
        { name: 'Servizio', value: data.service || '-', inline: true },
        { name: 'Totale', value: '€' + data.total, inline: true },
        { name: 'Discord', value: data.discordId || '-', inline: true }
      ]
    };
  } else if (type === 'nuova_disdetta') {
    embed = {
      title: '❌ Nuova Disdetta', color: 16711782,
      fields: [
        { name: 'ID', value: String(data.id), inline: true },
        { name: 'Servizio', value: data.service || '-', inline: true },
        { name: 'Discord', value: data.discordId || '-', inline: true }
      ]
    };
  }
  
  try {
    UrlFetchApp.fetch(DISCORD_WEBHOOK_URL, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ embeds: [embed] })
    });
  } catch(e) {}
}

function testConnection() {
  return { success: true, message: 'OK!' };
}
