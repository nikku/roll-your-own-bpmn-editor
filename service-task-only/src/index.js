import StoPaletteProvider from './StoPaletteProvider';
import StoContextPadProvider from './StoContextPadProvider';
import StoReplaceMenuProvider from './StoReplaceMenuProvider';

export default {
  __init__: [
    'stoPaletteProvider',
    'stoContextPadProvider',
    'stoReplaceMenuProvider'
  ],
  stoPaletteProvider: [ 'type', StoPaletteProvider ],
  stoContextPadProvider: [ 'type', StoContextPadProvider ],
  stoReplaceMenuProvider: [ 'type', StoReplaceMenuProvider ]
};