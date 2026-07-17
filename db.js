/**
 * Money Tracker - Camada de Armazenamento (IndexedDB)
 */

const DB_NAME = 'MoneyTrackerDB';
const DB_VERSION = 2;

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
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'chave' });
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

  // ==========================================
  // CONFIG: armazenamento chave/valor (PIN e meta de economia), unificado
  // no mesmo IndexedDB do resto dos dados — assim entra no backup/restore.
  // ==========================================
  async getConfigValue(chave, defaultValue = null) {
    return new Promise((resolve, reject) => {
      const request = this._getStore('config', 'readonly').get(chave);
      request.onsuccess = () => resolve(request.result ? request.result.valor : defaultValue);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async setConfigValue(chave, valor) {
    return new Promise((resolve, reject) => {
      const request = this._getStore('config', 'readwrite').put({ chave, valor });
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deleteConfigValue(chave) {
    return new Promise((resolve, reject) => {
      const request = this._getStore('config', 'readwrite').delete(chave);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  getAllConfig() { return this._getAll('config'); }

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
    const stores = ['contas', 'categorias', 'estabelecimentos', 'transacoes', 'investimentos', 'config'];
    const data = {};
    for (const s of stores) data[s] = await this._getAll(s);
    return {
      app: 'MoneyTracker',
      version: DB_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  // ==========================================
  // VALIDAÇÃO DE SCHEMA DO BACKUP
  // Roda por inteiro ANTES de qualquer alteração no banco. Se qualquer item
  // do arquivo for inválido, importAll() nem chega a tocar nos dados atuais.
  // ==========================================
  _validateBackupPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Arquivo de backup inválido: conteúdo não é um JSON válido.');
    }
    if (payload.app !== 'MoneyTracker') {
      throw new Error('Este arquivo não parece ser um backup do Money Tracker.');
    }
    if (!payload.data || typeof payload.data !== 'object') {
      throw new Error('Arquivo de backup inválido: seção "data" ausente ou corrompida.');
    }

    const stores = ['contas', 'categorias', 'estabelecimentos', 'transacoes', 'investimentos', 'config'];
    for (const s of stores) {
      if (payload.data[s] !== undefined && !Array.isArray(payload.data[s])) {
        throw new Error(`Arquivo de backup inválido: "${s}" deveria ser uma lista.`);
      }
    }

    const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
    const isStr = (v) => typeof v === 'string';
    const isNumOrNull = (v) => v === null || v === undefined || isNum(v);

    const contaIds = new Set();
    (payload.data.contas || []).forEach((c, i) => {
      if (!isStr(c.nome) || !c.nome.trim()) throw new Error(`Conta #${i + 1} inválida: nome ausente.`);
      if (!isNum(c.saldoAtual)) throw new Error(`Conta "${c.nome}" inválida: saldo precisa ser numérico.`);
      if (c.id !== undefined) contaIds.add(Number(c.id));
    });

    (payload.data.categorias || []).forEach((c, i) => {
      if (!isStr(c.nome) || !c.nome.trim()) throw new Error(`Categoria #${i + 1} inválida: nome ausente.`);
      if (!isNumOrNull(c.orcamento)) throw new Error(`Categoria "${c.nome}" inválida: orçamento precisa ser numérico.`);
    });

    (payload.data.estabelecimentos || []).forEach((e, i) => {
      if (!isStr(e.nome) || !e.nome.trim()) throw new Error(`Estabelecimento #${i + 1} inválido: nome ausente.`);
    });

    (payload.data.config || []).forEach((c, i) => {
      if (!isStr(c.chave) || !c.chave.trim()) throw new Error(`Config #${i + 1} inválida: chave ausente.`);
    });

    const invIds = new Set();
    (payload.data.investimentos || []).forEach((inv, i) => {
      if (!isStr(inv.nome) || !inv.nome.trim()) throw new Error(`Investimento #${i + 1} inválido: nome ausente.`);
      if (!isNum(inv.valorAportado)) throw new Error(`Investimento "${inv.nome}" inválido: valor aportado precisa ser numérico.`);
      if (!isNum(inv.patrimônioAtual)) throw new Error(`Investimento "${inv.nome}" inválido: patrimônio atual precisa ser numérico.`);
      if (inv.id !== undefined) invIds.add(Number(inv.id));
    });

    const tiposValidos = ['receita', 'despesa', 'transferencia', 'aporte', 'rendimento'];
    (payload.data.transacoes || []).forEach((t, i) => {
      if (!tiposValidos.includes(t.tipo)) throw new Error(`Transação #${i + 1} inválida: tipo "${t.tipo}" desconhecido.`);
      if (!isNum(t.valor) || t.valor <= 0) throw new Error(`Transação #${i + 1} (${t.tipo}) inválida: valor precisa ser numérico e positivo.`);
      if (!isStr(t.data) || !t.data) throw new Error(`Transação #${i + 1} (${t.tipo}) inválida: data ausente.`);

      if ((t.tipo === 'receita' || t.tipo === 'despesa') && !t.contaId) {
        throw new Error(`Transação #${i + 1} (${t.tipo}) inválida: conta ausente.`);
      }
      if (t.tipo === 'transferencia' && (!t.contaId || !t.contaDestinoId)) {
        throw new Error(`Transação #${i + 1} (transferência) inválida: conta de origem ou destino ausente.`);
      }
      if (t.tipo === 'aporte' && (!t.contaId || !t.investimentoId)) {
        throw new Error(`Transação #${i + 1} (aporte) inválida: conta ou investimento ausente.`);
      }
      if (t.tipo === 'rendimento' && !t.investimentoId) {
        throw new Error(`Transação #${i + 1} (rendimento) inválida: investimento ausente.`);
      }
      if (t.contaId && !contaIds.has(Number(t.contaId))) {
        throw new Error(`Transação #${i + 1} referencia a conta #${t.contaId}, que não existe no arquivo.`);
      }
      if (t.contaDestinoId && !contaIds.has(Number(t.contaDestinoId))) {
        throw new Error(`Transação #${i + 1} referencia a conta de destino #${t.contaDestinoId}, que não existe no arquivo.`);
      }
      if (t.investimentoId && !invIds.has(Number(t.investimentoId))) {
        throw new Error(`Transação #${i + 1} referencia o investimento #${t.investimentoId}, que não existe no arquivo.`);
      }
    });
  }

  async importAll(payload) {
    // 1) Valida o arquivo inteiro primeiro — nenhum dado atual é tocado se isso lançar erro.
    this._validateBackupPayload(payload);

    const stores = ['contas', 'categorias', 'estabelecimentos', 'transacoes', 'investimentos', 'config'];

    // 2) Limpa e insere dentro de UMA ÚNICA transação IndexedDB: se qualquer put() falhar,
    // a transação inteira é abortada automaticamente e nada do que já foi escrito é
    // persistido — ou importa tudo, ou não muda nada (atômico).
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(stores, 'readwrite');
      tx.onabort = () => reject(tx.error || new Error('Importação cancelada: a transação foi abortada.'));
      tx.onerror = () => reject(tx.error || new Error('Falha ao importar o backup.'));
      tx.oncomplete = () => resolve(true);

      for (const s of stores) {
        const store = tx.objectStore(s);
        store.clear();
        const items = payload.data[s] || [];
        for (const item of items) store.put(item);
      }
    });
  }
}

const dbInstance = new MoneyTrackerDB();
window.db = dbInstance;