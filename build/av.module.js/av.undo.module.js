/** USAGE:
 * Pass an object (or other variable) through UndoHistory.add() whenever an undoable change is made.
 * Run UndoHistory.undo() to undo and UndoHistory.redo() to redo.
 * UndoHistory.onChange() will be run whenever UndoHistory.undo or UndoHistory.redo is called.
 *     The first parameter will be the variable passed earlier into UndoHistory.add.
 * UndoHistory.onUndo() and UndoHistory.onRedo() act as UndoHistory.onChange() but while undoing or redoing (respectively).
 *     If they are defined, then they will override UndoHistory.onChange().
 */

/** Allows undoing and redoing things.
 * @class
 */
export default class UndoHistory {
    /** A user-defined undo state that will be provided to UndoHandler functions.
     * @typedef {any} State
     */
    /** UndoHandler function.
     * @callback UndoHandler
     * @param {State} state - Data of new state.
     * @param {"undo"|"redo"|"add"} mode - Which action is being made.
     */

    /** @type {string} Version of UndoHistory. */
    get version() {
        return '221224';
    }

    /** @type {State[]} Undo history. */
    history;
    /** @type {number} Index of current place in history. */
    index;
    /** @type {UndoHandler} Runs when a state is added to the history. */
    onAdd;
    /** @type {UndoHandler} Runs on redo and undo. */
    onChange;
    /** @type {UndoHandler} Runs on undo. Overrides onChange. */
    onUndo;
    /** @type {UndoHandler} Runs on redo. Overrides onChange. */
    onRedo;

    /** Constructor.
     * @param {UndoHandler} [onChange] - What happens to a stored action when moving in history.
     * @param {UndoHandler} [onUndo] - What happens to a stored action when moving backward in history. Overrides onChange().
     * @param {UndoHandler} [onRedo] - What happens to a stored action when moving forward in history. Overrides onChange().
     * @param {UndoHandler} [onAdd] - What happens when a stored action is added to the history.
     */
    constructor( onChange, onUndo, onRedo, onAdd ) {
        this.index = -1;
        this.history = [];
        this.onAdd = onAdd || ( () => { } );
        this.onChange = onChange || ( () => { } );
        if ( typeof onRedo === 'function' ) this.onRedo = onRedo;
        if ( typeof onUndo === 'function' ) this.onUndo = onUndo;
    }

    /** Add something to the history.
     * @param {State} state - The history state to add.
     */
    add( state ) {
        if ( this.index !== this.history.length - 1 ) {
            /// Remove redo history.
            this.history = this.history.slice( 0, this.index + 1 );
        }
        this.history.push( state );
        this.index = this.history.length - 1;
        this.onAdd( state, 'add' );
    }

    /** Clears the history. */
    clear() {
        this.index = -1;
        this.history = [];
    }

    /** Travels back in history.
     * @param {UndoHandler} [onSuccess] - An additional function to run before onUndo or onChange.
     */
    undo( onSuccess ) {
        if ( this.index === 0 ) {
            console.warn( 'Nothing left to undo.' );
            return;
        }
        const state = this.history[ --this.index ];
        if ( onSuccess ) onSuccess( state, 'undo' );
        this.onUndo ? this.onUndo( state, 'undo' ) : this.onChange( state, 'undo' );
    }

    /** Travels forward in history.
     * @param {UndoHandler} [onSuccess] - An additional function to run before onRedo or onChange.
     */
    redo( onSuccess ) {
        if ( this.index === this.history.length - 1 ) {
            console.warn( 'Nothing left to redo.' );
            return;
        }
        const state = this.history[ ++this.index ];
        if ( onSuccess ) onSuccess( state, 'redo' );
        this.onRedo ? this.onRedo( state, 'undo' ) : this.onChange( state, 'undo' );
    }
}