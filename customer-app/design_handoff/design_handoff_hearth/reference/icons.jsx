// Inline SVG icons — 1.5px stroke on a 24px grid, rounded caps, currentColor.
// No icon font, no sprite sheet, no emoji as UI icons.

const base = size => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true, focusable: false
});

const Icon = ({ size = 16, children, ...rest }) => (
  <svg {...base(size)} {...rest}>{children}</svg>
);

const Gauge = p => <Icon {...p}><path d="M12 14l4-4" /><path d="M3.5 18a9 9 0 1117 0" /></Icon>;
const Receipt = p => <Icon {...p}><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-3-2z" /><path d="M9 8h6M9 12h6" /></Icon>;
const BookOpen = p => <Icon {...p}><path d="M12 6C10 4.5 7.5 4 4 4v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V4c-3.5 0-6 .5-8 2z" /><path d="M12 6v14" /></Icon>;
const Truck = p => <Icon {...p}><path d="M2 7h11v9H2z" /><path d="M13 10h4l3 3v3h-7z" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="17" cy="18.5" r="1.8" /></Icon>;
const Card = p => <Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Icon>;
const MapPin = p => <Icon {...p}><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Icon>;
const ChevronDown = p => <Icon {...p}><path d="M6 9.5l6 6 6-6" /></Icon>;
const Search = p => <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Icon>;
const Power = p => <Icon {...p}><path d="M12 3v8" /><path d="M6.5 7a8 8 0 1011 0" /></Icon>;
const Alert = p => <Icon {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></Icon>;
const Inbox = p => <Icon {...p}><path d="M3 13l2.5-8h13L21 13v6H3z" /><path d="M3 13h5l1 2.5h6L16 13h5" /></Icon>;

const icons = { Gauge, Receipt, BookOpen, Truck, Card, MapPin, ChevronDown, Search, Power, Alert, Inbox };

window.HearthIcons = icons;
