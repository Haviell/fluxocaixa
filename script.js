// Formata string "1.500,00" para número float
function strParaNumero(valorStr) {
    if (!valorStr) return 0;
    let num = valorStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(num) || 0;
  }
  
  // Formata número para moeda BRL (ex: 1500 -> 1.500,00)
  function numeroParaMoeda(valorNum) {
    return valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // Remove linha da tabela
  function removerLinha(botao) {
    const tr = botao.closest('tr');
    tr.remove();
    calcularTotais();
  }
  
  // Adiciona linha nova na tabela especificada (entradas ou saídas)
  function adicionarLinha(idTabela) {
    const tabela = document.getElementById(idTabela);
    const tbody = tabela.querySelector('tbody');
    const tr = document.createElement('tr');
  
    tr.innerHTML = `
      <td><input value="" placeholder="Descrição"/></td>
      <td>
        <select>
          <option value="operacional">Operacional</option>
          <option value="investimento">Investimento</option>
          <option value="financiamento">Financiamento</option>
        </select>
      </td>
      <td><input class="money" value="0,00" /></td>
      <td><button class="danger mini" onclick="removerLinha(this)">×</button></td>
    `;
  
    tbody.appendChild(tr);
    adicionarEventos(tr.querySelector('input.money'));
    calcularTotais();
  }
  
  // Adiciona evento para formatar campo de dinheiro ao digitar
  function adicionarEventos(inputMoney) {
    inputMoney.addEventListener('input', e => {
      // Remove caracteres inválidos e formata moeda
      let valor = e.target.value.replace(/[^\d,]/g, '').replace(/,/g, ',');
      // Só permite números e vírgula
      e.target.value = valor;
    });
    inputMoney.addEventListener('blur', e => {
      let valor = strParaNumero(e.target.value);
      e.target.value = numeroParaMoeda(valor);
      calcularTotais();
    });
  }
  
  // Calcula todos os totais e atualiza a interface
  function calcularTotais() {
    const saldoInicial = strParaNumero(document.getElementById('saldoInicial').value);
    const entradas = pegarValoresTabela('tEntradas');
    const saidas = pegarValoresTabela('tSaidas');
  
    const totalEntradas = entradas.reduce((acc, cur) => acc + cur.valor, 0);
    const totalSaidas = saidas.reduce((acc, cur) => acc + cur.valor, 0);
    const saldoFinal = saldoInicial + totalEntradas - totalSaidas;
  
    // Atualiza campos principais
    document.getElementById('kEntradas').textContent = numeroParaMoeda(totalEntradas);
    document.getElementById('kSaidas').textContent = numeroParaMoeda(totalSaidas);
    document.getElementById('kSaldoFinal').textContent = numeroParaMoeda(saldoFinal);
    document.getElementById('kLancs').textContent = entradas.length + saidas.length;
  
    // Atualiza decomposição por categoria
    decomporFluxo(entradas, saidas);
  }
  
  // Pega valores e categorias da tabela passada pelo id
  function pegarValoresTabela(idTabela) {
    const tabela = document.getElementById(idTabela);
    const linhas = tabela.querySelectorAll('tbody tr');
    const dados = [];
  
    linhas.forEach(linha => {
      const inputs = linha.querySelectorAll('input, select');
      const descricao = inputs[0].value.trim();
      const categoria = inputs[1].value;
      const valor = strParaNumero(inputs[2].value);
      dados.push({ descricao, categoria, valor });
    });
  
    return dados;
  }
  
  // Atualiza decomposição do fluxo por categoria
  function decomporFluxo(entradas, saidas) {
    const categorias = ['operacional', 'investimento', 'financiamento'];
  
    const totalEntradaCat = {};
    const totalSaidaCat = {};
    categorias.forEach(cat => {
      totalEntradaCat[cat] = entradas
        .filter(e => e.categoria === cat)
        .reduce((acc, cur) => acc + cur.valor, 0);
      totalSaidaCat[cat] = saidas
        .filter(s => s.categoria === cat)
        .reduce((acc, cur) => acc + cur.valor, 0);
    });
  
    // Atualiza HTML das decomposições
    categorias.forEach(cat => {
      document.getElementById(`decEntrada${capitalize(cat)}`).textContent = numeroParaMoeda(totalEntradaCat[cat]);
      document.getElementById(`decSaida${capitalize(cat)}`).textContent = numeroParaMoeda(totalSaidaCat[cat]);
      document.getElementById(`decFluxo${capitalize(cat)}`).textContent = numeroParaMoeda(totalEntradaCat[cat] - totalSaidaCat[cat]);
    });
  }
  
  // Capitaliza primeira letra
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // Exporta tabela para Excel (arquivo .xls simples)
  function exportarParaExcel() {
    const saldoInicial = document.getElementById('saldoInicial').value;
    const entradas = pegarValoresTabela('tEntradas');
    const saidas = pegarValoresTabela('tSaidas');
  
    let html = `
    <table border="1">
      <tr><th colspan="3" style="background:#004aad;color:#fff;">Fluxo de Caixa da Empresa</th></tr>
      <tr><td>Saldo Inicial</td><td colspan="2">${saldoInicial}</td></tr>
      <tr><th>Descrição</th><th>Categoria</th><th>Valor (Entradas)</th></tr>`;
  
    entradas.forEach(item => {
      html += `<tr><td>${item.descricao}</td><td>${capitalize(item.categoria)}</td><td>${numeroParaMoeda(item.valor)}</td></tr>`;
    });
  
    html += `<tr><th>Descrição</th><th>Categoria</th><th>Valor (Saídas)</th></tr>`;
  
    saidas.forEach(item => {
      html += `<tr><td>${item.descricao}</td><td>${capitalize(item.categoria)}</td><td>${numeroParaMoeda(item.valor)}</td></tr>`;
    });
  
    html += '</table>';
  
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fluxo_caixa.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // Eventos ao carregar a página
  window.onload = () => {
    document.getElementById('saldoInicial').addEventListener('input', () => {
      // Permite somente números, vírgulas e pontos no saldo inicial
      let val = document.getElementById('saldoInicial').value;
      val = val.replace(/[^\d,\.]/g, '');
      document.getElementById('saldoInicial').value = val;
      calcularTotais();
    });
  
    // Formatar inputs money e adicionar evento de cálculo
    document.querySelectorAll('input.money').forEach(input => {
      adicionarEventos(input);
    });
  
    document.getElementById('resetar').addEventListener('click', () => {
      location.reload(); // recarrega para os valores padrão do HTML
    });
  
    document.getElementById('exportar').addEventListener('click', exportarParaExcel);
  
    // Inicializa cálculos
    calcularTotais();
  };
  