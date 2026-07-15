/**
 * Money Tracker - Camada de Armazenamento (IndexedDB)
 */

const DB_NAME = 'MoneyTrackerDB';
const DB_VERSION = 1;

class MoneyTrackerDB {
  constructor() {
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      if (this.db) return resolve(this.db);
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (e) => reject(e.target.error);
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('contas')) {
          db.createObjectStore('contas', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('categorias')) {
          db.createObjectStore('categorias', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('estabelecimentos')) {
          db.createObjectStore('estabelecimentos', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('transacoes')) {
          const tStore = db.createObjectStore('transacoes', { keyPath: 'id', autoIncrement: true });
          tStore.createIndex('by_data', 'data', { unique: false });
        }
        if (!db.objectStoreNames.contains('investimentos')) {
          db.createObjectStore('investimentos', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  _getStore(name, mode = 'readonly') {
    const transaction = this.db.transaction(name, mode);
    return transaction.objectStore(name);
  }

  _add(name, data) {
    return new Promise((res, rej) => {
      const request = this._getStore(name, 'readwrite').add(data);
      request.onsuccess = () => res(request.result);
      request.onerror = (e) => rej(e.target.error);
    });
  }

  _getAll(name) {
    return new Promise((res, rej) => {
      const request = this._getStore(name, 'readonly').getAll();
      request.onsuccess = () => res(request.result);
      request.onerror = (e) => rej(e.target.error);
    });
  }

  _getById(name, id) {
    return new Promise((res, rej) => {
      const request = this._getStore(name, 'readonly').get(Number(id));
      request.onsuccess = () => res(request.result);
      request.onerror = (e) => rej(e.target.error);
    });
  }

  _update(name, data) {
    return new Promise((res, rej) => {
      const request = this._getStore(name, 'readwrite').put(data);
      request.onsuccess = () => res(request.result);
      request.onerror = (e) => rej(e.target.error);
    });
  }

  _delete(name, id) {
    return new Promise((res, rej) => {
      const request = this._getStore(name, 'readwrite').delete(Number(id));
      request.onsuccess = () => res(true);
      request.onerror = (e) => rej(e.target.error);
    });
  }

  addConta(data) { return this._add('contas', data); }
  getContas() { return this._getAll('contas'); }
  getContaById(id) { return this._getById('contas', id); }
  updateConta(data) { return this._update('contas', data); }
  deleteConta(id) { return this._delete('contas', id); }

  addCategoria(data) { return this._add('categorias', data); }
  getCategorias() { return this._getAll('categorias'); }
  getCategoriaById(id) { return this._getById('categorias', id); }
  updateCategoria(data) { return this._update('categorias', data); }
  deleteCategoria(id) { return this._delete('categorias', id); }

  addEstabelecimento(data) { return this._add('estabelecimentos', data); }
  getEstabelecimentos() { return this._getAll('estabelecimentos'); }

  addInvestimento(data) { return this._add('investimentos', data); }
  getInvestimentos() { return this._getAll('investimentos'); }
  getInvestimentoById(id) { return this._getById('investimentos', id); }
  updateInvestimento(data) { return this._update('investimentos', data); }
  deleteInvestimento(id) { return this._delete('investimentos', id); }

  async addTransacao(data) {
    const id = await this._add('transacoes', data);
    await this._adjustBalances(data, 'add');
    return id;
  }

  async getTransacoes() { return this._getAll('transacoes'); }
  getTransacaoById(id) { return this._getById('transacoes', id); }

  async deleteTransacao(id) {
    const transacao = await this.getTransacaoById(id);
    if (transacao) {
      await this._adjustBalances(transacao, 'delete');
      await this._delete('transacoes', id);
    }
    return true;
  }

  async updateTransacao(data) {
    const oldTrans = await this.getTransacaoById(data.id);
    if (oldTrans) {
      await this._adjustBalances(oldTrans, 'delete');
    }
    const result = await this._update('transacoes', data);
    await this._adjustBalances(data, 'add');
    return result;
  }

  async _adjustBalances(trans, action) {
    const valor = Number(trans.valor);
    const multiplier = action === 'add' ? 1 : -1;

    if (trans.tipo === 'receita') {
      const conta = await this.getContaById(trans.contaId);
      if (conta) { conta.saldoAtual = Number(conta.saldoAtual) + (valor * multiplier); await this.updateConta(conta); }
    } else if (trans.tipo === 'despesa') {
      const conta = await this.getContaById(trans.contaId);
      if (conta) { conta.saldoAtual = Number(conta.saldoAtual) - (valor * multiplier); await this.updateConta(conta); }
    } else if (trans.tipo === 'transferencia') {
      const contaOrigem = await this.getContaById(trans.contaId);
      const contaDestino = await this.getContaById(trans.contaDestinoId);
      if (contaOrigem) { contaOrigem.saldoAtual = Number(contaOrigem.saldoAtual) - (valor * multiplier); await this.updateConta(contaOrigem); }
      if (contaDestino) { contaDestino.saldoAtual = Number(contaDestino.saldoAtual) + (valor * multiplier); await this.updateConta(contaDestino); }
    } else if (trans.tipo === 'aporte') {
      const contaOrigem = await this.getContaById(trans.contaId);
      const investimento = await this.getInvestimentoById(trans.investimentoId);
      if (contaOrigem) { contaOrigem.saldoAtual = Number(contaOrigem.saldoAtual) - (valor * multiplier); await this.updateConta(contaOrigem); }
      if (investimento) {
        investimento.valorAportado = Number(investimento.valorAportado) + (valor * multiplier);
        investimento.patrimônioAtual = Number(investimento.patrimônioAtual) + (valor * multiplier);
        investimento.rendimentoAcumulado = Number(investimento.patrimônioAtual) - Number(investimento.valorAportado);
        await this.updateInvestimento(investimento);
      }
    } else if (trans.tipo === 'rendimento') {
      const investimento = await this.getInvestimentoById(trans.investimentoId);
      if (investimento) {
        investimento.patrimônioAtual = Number(investimento.patrimônioAtual) + (valor * multiplier);
        investimento.rendimentoAcumulado = Number(investimento.patrimônioAtual) - Number(investimento.valorAportado);
        await this.updateInvestimento(investimento);
      }
    }
  }

  // ==========================================
  // BACKUP: EXPORTAÇÃO E IMPORTAÇÃO COMPLETA
  // ==========================================
  async exportAll() {
    const stores = ['contas', 'categorias', 'estabelecimentos', 'transacoes', 'investimentos'];
    const data = {};
    for (const s of stores) data[s] = await this._getAll(s);
    return {
      app: 'MoneyTracker',
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  async importAll(payload) {
    if (!payload || !payload.data) throw new Error('Arquivo de backup inválido.');
    const stores = ['contas', 'categorias', 'estabelecimentos', 'transacoes', 'investimentos'];

    // Limpa todas as stores existentes antes de importar (substituição completa)
    for (const s of stores) {
      const all = await this._getAll(s);
      for (const item of all) await this._delete(s, item.id);
    }

    // Insere os dados importados preservando os IDs originais (usa put)
    for (const s of stores) {
      const items = payload.data[s] || [];
      for (const item of items) {
        await new Promise((res, rej) => {
          const request = this._getStore(s, 'readwrite').put(item);
          request.onsuccess = () => res(request.result);
          request.onerror = (e) => rej(e.target.error);
        });
      }
    }
    return true;
  }
}

const dbInstance = new MoneyTrackerDB();
window.db = dbInstance;