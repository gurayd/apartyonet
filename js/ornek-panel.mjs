const units = [
  ['A01', 'A', 'A-01 · Daire', 125000], ['A02', 'A', 'A-02 · Daire', 125000],
  ['A03', 'A', 'A-03 · Daire', 125000], ['A04', 'A', 'A-04 · Dükkan', 175000],
  ['B01', 'B', 'B-01 · Daire', 125000], ['B02', 'B', 'B-02 · Daire', 125000],
  ['B03', 'B', 'B-03 · Daire', 125000], ['B04', 'B', 'B-04 · Dükkan', 175000]
];
const months = {
  '2026-10': { paid: [125000, 125000, 125000, 162500, 125000, 125000, 0, 0], expenses: [['Asansör bakımı', 240000], ['Ortak alan elektriği', 122500], ['Temizlik', 180000]] },
  '2026-09': { paid: [125000, 50000, 125000, 175000, 125000, 125000, 125000, 175000], expenses: [['Ortak alan elektriği', 110000], ['Temizlik', 180000]] }
};
const residentUnit = 'A02';
const labels = { paid: 'Ödendi', partial: 'Kısmi ödeme', open: 'Ödeme bekliyor' };
const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const money = cents => currency.format(cents / 100);

export function getDemoView({ period, role = 'manager', block = 'all', status = 'all' }) {
  const month = Object.hasOwn(months, period) ? months[period] : months['2026-10'];
  const resident = role === 'resident';
  const rows = units.map(([id, group, name, expected], index) => {
    const paid = month.paid[index];
    return { id, block: group, name, expected, paid, status: paid >= expected ? 'paid' : paid > 0 ? 'partial' : 'open' };
  }).filter(row => resident ? row.id === residentUnit : block === 'all' || row.block === block);
  const expected = rows.reduce((sum, row) => sum + row.expected, 0);
  const paid = rows.reduce((sum, row) => sum + row.paid, 0);
  const expenses = resident ? [] : month.expenses;
  return { resident, expected, paid, remaining: expected - paid, expenses, expenseTotal: expenses.reduce((sum, [, cost]) => sum + cost, 0),
    rows: resident || status === 'all' ? rows : rows.filter(row => row.status === status) };
}

function init() {
  const byId = id => document.getElementById(id);
  const element = (tag, value) => Object.assign(document.createElement(tag), { textContent: value });
  function render() {
    const view = getDemoView({ period: byId('period').value, block: byId('block').value, status: byId('status').value, role: document.querySelector('[name="role"]:checked').value });
    byId('filters').hidden = view.resident;
    byId('expenses').hidden = view.resident;
    byId('expected-label').textContent = view.resident ? 'Dairemin aidatı' : 'Beklenen aidat';
    byId('paid-label').textContent = view.resident ? 'Ödediğim tutar' : 'Tahsil edilen';
    byId('records-title').textContent = view.resident ? 'Dairemin aidat durumu' : 'Ödeme durumları';
    for (const key of ['expected', 'paid', 'remaining']) byId(key).textContent = money(view[key]);
    byId('expense-total').textContent = money(view.expenseTotal);
    byId('expense-list').replaceChildren(...view.expenses.map(([name, cost]) => {
      const li = element('li', ''); li.append(element('span', name), element('strong', money(cost))); return li;
    }));
    byId('row-count').textContent = view.rows.length ? `${view.rows.length} bölüm gösteriliyor` : 'Bu filtrelerle eşleşen bölüm yok.';
    byId('records').replaceChildren(...view.rows.map(row => {
      const tr = element('tr', '');
      const state = element('td', '');
      const badge = element('span', labels[row.status]); badge.className = `pill ${row.status}`; state.append(badge);
      tr.append(element('td', row.name), element('td', money(row.expected)), element('td', money(row.paid)), state);
      return tr;
    }));
  }
  document.querySelectorAll('select, input[name="role"]').forEach(input => input.addEventListener('change', render));
  render();
}

if (typeof document !== 'undefined' && document.getElementById('records')) init();
