// ====== Helpers ======
function strParaNumero(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
}

function numeroParaMoeda(num) {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ====== Adicionar e Remover Linhas ======
function adicionarLinha(tabelaId) {
  const tabela = document.getElementById(tabelaId).querySelector('tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
      <td><input value="" /></td>
      <td>
          <select>
              <option value="operacional">Operacional</option>
              <option value="investimento">Investimento</option>
              <option value="financiamento">Financiamento</option>
          </select>
      </td>
      <td><input class="money" value="0,00"/></td>
      <td><button class="danger mini" onclick="removerLinha(this)">×</button></td>
  `;
  tabela.appendChild(tr);
  atualizarTotais();
}

function removerLinha(btn) {
  btn.closest('tr').remove();
  atualizarTotais();
}

// ====== Calcular Totais e Decomposição ======
function atualizarTotais() {
  const saldoInicial = strParaNumero(document.getElementById('saldoInicial').value);

  let entradas = 0, saidas = 0, lancamentos = 0;
  const dec = {
      operacional: { entrada: 0, saida: 0 },
      investimento: { entrada: 0, saida: 0 },
      financiamento: { entrada: 0, saida: 0 }
  };

  // Entradas
  document.querySelectorAll('#tEntradas tbody tr').forEach(tr => {
      const valor = strParaNumero(tr.querySelector('input.money').value);
      const cat = tr.querySelector('select').value;
      entradas += valor;
      lancamentos += 1;
      dec[cat].entrada += valor;
  });

  // Saídas
  document.querySelectorAll('#tSaidas tbody tr').forEach(tr => {
      const valor = strParaNumero(tr.querySelector('input.money').value);
      const cat = tr.querySelector('select').value;
      saidas += valor;
      lancamentos += 1;
      dec[cat].saida += valor;
  });

  const saldoFinal = saldoInicial + entradas - saidas;

  // Atualiza KPIs
  document.getElementById('kEntradas').textContent = numeroParaMoeda(entradas);
  document.getElementById('kSaidas').textContent = numeroParaMoeda(saidas);
  document.getElementById('kSaldoFinal').textContent = numeroParaMoeda(saldoFinal);
  document.getElementById('kLancs').textContent = lancamentos;

  // Atualiza decomposição
  document.getElementById('decEntradaOp').textContent = numeroParaMoeda(dec.operacional.entrada);
  document.getElementById('decSaidaOp').textContent = numeroParaMoeda(dec.operacional.saida);
  document.getElementById('decFluxoOp').textContent = numeroParaMoeda(dec.operacional.entrada - dec.operacional.saida);

  document.getElementById('decEntradaInv').textContent = numeroParaMoeda(dec.investimento.entrada);
  document.getElementById('decSaidaInv').textContent = numeroParaMoeda(dec.investimento.saida);
  document.getElementById('decFluxoInv').textContent = numeroParaMoeda(dec.investimento.entrada - dec.investimento.saida);

  document.getElementById('decEntradaFin').textContent = numeroParaMoeda(dec.financiamento.entrada);
  document.getElementById('decSaidaFin').textContent = numeroParaMoeda(dec.financiamento.saida);
  document.getElementById('decFluxoFin').textContent = numeroParaMoeda(dec.financiamento.entrada - dec.financiamento.saida);
}

// ====== Exportar para Excel ======
document.getElementById('exportar').addEventListener('click', () => {
  const wb = XLSX.utils.book_new();

  function tabelaParaJson(tabelaId) {
      const data = [];
      document.querySelectorAll(`#${tabelaId} tbody tr`).forEach(tr => {
          const cols = tr.querySelectorAll('td');
          data.push({
              Descrição: cols[0].querySelector('input').value,
              Categoria: cols[1].querySelector('select').value,
              Valor: cols[2].querySelector('input').value
          });
      });
      return data;
  }

  const entradas = tabelaParaJson('tEntradas');
  const saidas = tabelaParaJson('tSaidas');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(entradas), 'Entradas');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(saidas), 'Saídas');

  XLSX.writeFile(wb, 'fluxo_de_caixa.xls');
});

// ====== Resetar Valores de Exemplo ======
document.getElementById('resetar').addEventListener('click', () => {
  location.reload();
});

// ====== Atualiza Totais ao mudar valores ======
document.getElementById('saldoInicial').addEventListener('input', atualizarTotais);
document.addEventListener('input', e => {
  if (e.target.classList.contains('money')) {
      atualizarTotais();
  }
});

// ====== Inicial ======
window.addEventListener('load', atualizarTotais);
