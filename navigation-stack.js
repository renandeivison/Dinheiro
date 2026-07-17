/**
 * NAVIGATION STACK SYSTEM
 * 
 * Substitui o sistema frágil de descobrir modais ativos pelo DOM
 * com uma pilha explícita que rastreia a ordem de abertura.
 * 
 * Uso:
 *   pushNavigation('fab', closeFabMenu);
 *   pushNavigation('account-modal', closeAccountModal);
 *   // Ao pressionar voltar, popstate chama a função no topo da pilha
 * 
 * Benefícios:
 *   - Sem dependência em classList.contains('active')
 *   - Preserva ordem histórica (FIFO)
 *   - Impossível ter "dois ativos ao mesmo tempo"
 *   - Debug fácil com labels
 *   - Transição suave: código antigo funciona enquanto migra
 */

class NavigationStack {
  constructor() {
    this.stack = [];
    this.debugMode = false; // ativa logs no console
  }

  /**
   * Adiciona uma entrada à pilha
   * @param {string} id - Identificador único (ex: 'fab', 'modal-account')
   * @param {Function} closeFn - Função que fecha/reseta o elemento
   * @param {string} [label] - Nome legível para debug (ex: 'FAB Menu')
   */
  push(id, closeFn, label = id) {
    if (typeof closeFn !== 'function') {
      console.error(`Navigation stack: closeFn must be a function for "${id}"`);
      return;
    }

    // Remove entrada duplicada se já existe
    const existing = this.stack.findIndex(e => e.id === id);
    if (existing !== -1) {
      this.stack.splice(existing, 1);
    }

    this.stack.push({ id, closeFn, label });
    this._log(`pushed "${label}" (stack size: ${this.stack.length})`);
  }

  /**
   * Remove a entrada do topo da pilha e chama sua função de fechamento
   * @returns {boolean} - true se havia algo para fechar, false se stack vazia
   */
  pop() {
    if (this.stack.length === 0) {
      this._log('stack vazia — deixar navegador fechar o app');
      return false;
    }

    const entry = this.stack.pop();
    this._log(`popped "${entry.label}" (stack size: ${this.stack.length})`);
    
    try {
      entry.closeFn();
    } catch (err) {
      console.error(`Erro ao chamar closeFn para "${entry.id}":`, err);
    }

    return true;
  }

  /**
   * Remove uma entrada específica da pilha (sem chamar closeFn)
   * Útil quando um elemento já foi fechado e você quer limpá-lo da pilha
   */
  remove(id) {
    const idx = this.stack.findIndex(e => e.id === id);
    if (idx !== -1) {
      const entry = this.stack[idx];
      this.stack.splice(idx, 1);
      this._log(`removed "${entry.label}" from stack (not closed, just removed)`);
    }
  }

  /**
   * Limpa a pilha completamente (ex: ao resetar o app)
   */
  clear() {
    this.stack = [];
    this._log('stack cleared');
  }

  /**
   * Retorna true se a pilha tem algo
   */
  hasEntries() {
    return this.stack.length > 0;
  }

  /**
   * Retorna o tamanho da pilha
   */
  size() {
    return this.stack.length;
  }

  /**
   * Retorna a entrada do topo sem remover
   */
  peek() {
    return this.stack[this.stack.length - 1] || null;
  }

  /**
   * Debug: imprime a pilha inteira no console
   */
  debugPrint() {
    console.group(`🔙 Navigation Stack (${this.stack.length} entries)`);
    this.stack.forEach((entry, idx) => {
      console.log(`${idx}. ${entry.label} (id: ${entry.id})`);
    });
    console.groupEnd();
  }

  _log(msg) {
    if (this.debugMode) {
      console.log(`[NavStack] ${msg}`);
    }
  }
}

// Instância global
const navigationStack = new NavigationStack();

/**
 * Interface pública simplificada
 * Use essas funções no lugar de armBackGuard()
 */
function pushNavigation(id, closeFn, label) {
  navigationStack.push(id, closeFn, label);
}

function popNavigation() {
  return navigationStack.pop();
}

function clearNavigation() {
  navigationStack.clear();
}

function removeNavigation(id) {
  navigationStack.remove(id);
}

function debugNavigation() {
  navigationStack.debugPrint();
}

/**
 * INTEGRAÇÃO COM O POPSTATE
 * 
 * Substitui o listener global window.addEventListener('popstate', ...) do app.js
 * 
 * Antes (linhas 173-203 em app.js):
 *   - Percorria BACK_BUTTON_HANDLERS procurando classList.contains('active')
 *   - Dependia de ordem do objeto
 *   - Podia ficar confuso com múltiplos modais abertos
 * 
 * Depois:
 *   - Pop simples da pilha e chama closeFn
 *   - Ordem sempre respeitada
 *   - Impossível ambiguidade
 */
function setupNavigationStackListener() {
  window.addEventListener('popstate', () => {
    const handled = navigationStack.pop();

    if (handled) {
      // Havia algo para fechar. Arma novo guard para próximo voltar.
      setTimeout(armNewNavigationGuard, 10);
    }
    // Se não havia nada, deixa o navegador fechar o app naturalmente
  });
}

/**
 * ARMAÇÃO DO GUARD
 * 
 * Substitui armBackGuard() do app.js
 * Adiciona entrada na pilha do navegador para interceptar próximo botão voltar
 * 
 * Mantém compatibilidade: continua usando history.pushState internamente,
 * mas agora coordena com a pilha de navegação
 */
function armNewNavigationGuard() {
  try {
    history.pushState({ mtBackGuard: true }, '');
  } catch (e) {
    // Alguns navegadores restringem pushState em file:// etc
    // Não quebra o app, só não consegue interceptar botão voltar
  }
}

/**
 * EXPORTA PARA COMPATIBILIDADE
 * 
 * Se o código legado ainda chama armBackGuard() diretamente,
 * isso vai funcionar enquanto faz a transição para pushNavigation()
 * 
 * Gradualmente substitua:
 *   armBackGuard() → armNewNavigationGuard()
 *   focusFirstField + armBackGuard() → pushNavigation() + focusFirstField()
 */
function armBackGuard() {
  armNewNavigationGuard();
}
