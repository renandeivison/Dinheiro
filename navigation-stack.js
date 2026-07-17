/**
 * Money Tracker - Navigation Stack
 *
 * Pilha explícita que rastreia, na ordem exata em que foram abertos, todos os
 * modais/telas que o botão/gesto Voltar do Android deve poder fechar.
 *
 * Substitui o antigo esquema baseado em `classList.contains('active')` +
 * BACK_BUTTON_HANDLERS (ver NAVIGATION_REFACTORING.md).
 *
 * Uso:
 *   pushNavigation('modal-account', closeAccountModal, 'Modal Conta'); // ao abrir
 *   removeNavigation('modal-account');                                 // ao fechar
 *   navigationStack.pop();                                             // no popstate
 *   debugNavigation();                                                 // inspeção manual no console
 */

class NavigationStack {
  constructor() {
    this.stack = [];
  }

  /**
   * Registra um elemento no topo da pilha.
   * Se o id já estiver presente (ex: reabertura sem fechar antes), move-o pro topo
   * em vez de duplicar a entrada — evita entradas fantasmas na pilha.
   */
  push(id, closeFn, label = id) {
    this.remove(id);
    this.stack.push({ id, closeFn, label });
  }

  /** Remove um elemento da pilha (chamado quando ele fecha, de onde quer que venha). */
  remove(id) {
    const idx = this.stack.findIndex((entry) => entry.id === id);
    if (idx !== -1) this.stack.splice(idx, 1);
  }

  /**
   * Fecha o elemento do topo da pilha (chamado a partir do listener de popstate).
   * Quem está no topo é responsável por se remover da pilha dentro do seu próprio
   * closeFn (diretamente, ou por chamar sua função de fechar de verdade).
   * Retorna true se havia algo pra fechar, false se a pilha está vazia.
   */
  pop() {
    if (this.stack.length === 0) return false;
    const top = this.stack[this.stack.length - 1];
    top.closeFn();
    return true;
  }

  peek() {
    return this.stack.length ? this.stack[this.stack.length - 1] : null;
  }

  isEmpty() {
    return this.stack.length === 0;
  }

  clear() {
    this.stack = [];
  }
}

const navigationStack = new NavigationStack();

function pushNavigation(id, closeFn, label) {
  navigationStack.push(id, closeFn, label);
}

function removeNavigation(id) {
  navigationStack.remove(id);
}

function debugNavigation() {
  const entries = navigationStack.stack;
  console.log(`🔙 Navigation Stack (${entries.length} entries)`);
  entries.forEach((entry, i) => {
    console.log(`${i}. ${entry.label} (id: ${entry.id})`);
  });
}
