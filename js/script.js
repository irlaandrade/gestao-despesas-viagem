let despesas = [];
let taxaCambio = null;

onload = () => {
  storagedespesas = JSON.parse(localStorage.getItem("despesas"));

  if (storagedespesas != null && storagedespesas.length > 0) {
    despesas = storagedespesas;
    calcularListaDespesas();
  }
};

function adicionar() {
  const _id = document.getElementById("id").textContent;
  const descricao = document.getElementById("descricao").value;
  const quantidade = document.getElementById("quantidade").value;
  const valor = document.getElementById("valor").value;
  const moedaOrigem = document.getElementById("moedaOrigem").value;
  const moedaDestino = document.getElementById("moedaDestino").value;
  const button = document.getElementById('add');
  button.textContent = "Adicionar";

  if (descricao && quantidade && valor && moedaOrigem && moedaDestino) {
    const despesa = {
      id: _id || gerarGUID(),
      descricao,
      quantidade,
      valor,
      moedaOrigem,
      moedaDestino,
    };

    if (_id) {
      const index = despesas.findIndex(e => e.id === _id);
      despesas[index] = despesa;
    } else {
      despesas.push(despesa);
    }

    localStorage.setItem("despesas", JSON.stringify(despesas));

    document.getElementById("id").textContent = '';
    document.getElementById("descricao").value = '';
    document.getElementById("quantidade").value = '';
    document.getElementById("valor").value = '';
  }

  calcularListaDespesas();
}

function gerarGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

async function calcularListaDespesas() {
  document.getElementById("despesas").innerHTML = "";

  for (const [index, despesa] of despesas.entries()) {
    const despesaRow = document.createElement("div");
    const despesaItemSubItem = document.createElement("div");
    const despesaActionSubItem = document.createElement("div");

    despesaRow.classList.add("item");
    despesaItemSubItem.classList.add("subitem");
    despesaActionSubItem.classList.add("subitem");

    const despesaCalculada = await calcularDespesa(despesa.descricao, despesa.quantidade, despesa.valor, despesa.moedaOrigem, despesa.moedaDestino);
    const descricaoTitle = document.createElement("b");
    descricaoTitle.textContent = despesaCalculada.descricao;

    const descricaoDetalhe = document.createElement("article");
    descricaoDetalhe.textContent = `Qtde: ${despesaCalculada.quantidade} | ${despesaCalculada.moedaOrigem}: ${despesaCalculada.valor} | ${despesaCalculada.moedaDestino}: ${despesaCalculada.valorCalculado}`;

    despesaItemSubItem.append(descricaoTitle, descricaoDetalhe);

    const deleteButton = gerarBotaoDelete(despesa, index);
    const editButton = gerarBotaoEditar(despesa, index);

    despesaActionSubItem.append(editButton, deleteButton);
    despesaActionSubItem.id = 'action';

    despesaRow.append(despesaItemSubItem, despesaActionSubItem);
    document.getElementById("despesas").appendChild(despesaRow);
  }

  await calcularTotal();
}

function gerarBotaoEditar(despesa, index) {
  const editButton = document.createElement("a");
  editButton.type = "button";
  editButton.value = index;

  editButton.onclick = () => {
    const despesaId = document.getElementById('id');
    despesaId.textContent = despesa.id;

    const button = document.getElementById('add');
    button.textContent = "Atualizar";

    document.getElementById("descricao").value = despesa.descricao;
    document.getElementById("quantidade").value = despesa.quantidade;
    document.getElementById("valor").value = despesa.valor;
    document.getElementById("moedaOrigem").value = despesa.moedaOrigem;
    document.getElementById("moedaDestino").value = despesa.moedaDestino;
  };

  const editIcon = document.createElement("img");
  editIcon.src = "image/icons/icon-editar.png";
  editIcon.style.width = "20px";
  editIcon.style.height = "20px";

  editButton.appendChild(editIcon);

  return editButton;
}

function gerarBotaoDelete(despesa, index) {
  const deleteButton = document.createElement("a");
  deleteButton.type = "button";
  deleteButton.value = index;
  deleteButton.onclick = () => {
    const despesaList = document.getElementById("despesas");
    const id = despesa.id;
    if (confirm(`Deseja realmente excluir "${despesa.descricao}"?`)) {
      despesaList.children[deleteButton.value].remove();
      const index = despesas.findIndex(e => e.id === id);
      despesas.splice(index, 1);
      localStorage.setItem("despesas", JSON.stringify(despesas));
      calcularListaDespesas();
    }
  };
  const deleteIcon = document.createElement("img");
  deleteIcon.src = "image/icons/deletar.png";
  deleteIcon.style.width = "20px";
  deleteIcon.style.height = "20px";

  deleteButton.appendChild(deleteIcon);

  return deleteButton;
}

const calcularTotal = async () => {
  let totalOrigem = 0;
  let totalDestino = 0;

  const promises = despesas.map(async (despesa) => {
    await obterTaxasCambio(despesa.moedaOrigem, despesa.moedaDestino);
    totalOrigem += despesa.quantidade * taxaCambio[despesa.moedaOrigem] * despesa.valor;
    totalDestino += despesa.quantidade * taxaCambio[despesa.moedaDestino] * despesa.valor;
  });

  await Promise.all(promises);

  document.getElementById("total").innerHTML = "";
  const totalCard = document.createElement("div");

  const totalOrigemDescricao = document.createElement("p");
  totalOrigemDescricao.textContent = `Total [Moeda de Origem]: ${totalOrigem}`;

  const totalDestinoDescricao = document.createElement("p");
  totalDestinoDescricao.textContent = `Total [Moeda de Destino]: ${totalDestino}`;

  totalCard.append(totalOrigemDescricao, totalDestinoDescricao);
  document.getElementById("total").appendChild(totalCard);
}

const calcularDespesa = async (descricao, quantidade, valor, moedaOrigem, moedaDestino) => {
  const exchangeRate = await obterTaxasCambio(moedaOrigem, moedaDestino);
  const valorCalculado = quantidade * valor * exchangeRate;

  return { descricao, quantidade, valor, valorCalculado, moedaOrigem, moedaDestino };
}

const obterTaxasCambio = async (moedaOrigem, moedaDestino) => {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${moedaOrigem}`);
    const data = await response.json();
    taxaCambio = data.rates;

    return taxaCambio[moedaDestino];
  } catch (err) {
    console.error(err);
  }
}