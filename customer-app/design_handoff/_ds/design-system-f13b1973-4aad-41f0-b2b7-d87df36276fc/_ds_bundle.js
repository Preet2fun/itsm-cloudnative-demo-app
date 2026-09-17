/* @ds-bundle: {"format":4,"namespace":"DesignSystem_f13b19","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"GradientHeadline","sourcePath":"components/brand/GradientHeadline.jsx"},{"name":"KpiTile","sourcePath":"components/brand/KpiTile.jsx"},{"name":"Wordmark","sourcePath":"components/brand/Wordmark.jsx"},{"name":"LogViewer","sourcePath":"components/data/LogViewer.jsx"},{"name":"Sparkline","sourcePath":"components/data/Sparkline.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"FilterChip","sourcePath":"components/status/FilterChip.jsx"},{"name":"SeverityBadge","sourcePath":"components/status/SeverityBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/status/StatusBadge.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"CommandPalette","sourcePath":"components/surfaces/CommandPalette.jsx"},{"name":"Dialog","sourcePath":"components/surfaces/Dialog.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"8685f85cb1fc","components/actions/IconButton.jsx":"68d9cebf2688","components/brand/GradientHeadline.jsx":"7ff1b78446cb","components/brand/KpiTile.jsx":"db9f2d551d06","components/brand/Wordmark.jsx":"0f2b36416590","components/data/LogViewer.jsx":"d4f24dd3dbf1","components/data/Sparkline.jsx":"cfecf8cb6c78","components/data/Table.jsx":"28c8983ec684","components/feedback/EmptyState.jsx":"ff9747367d2f","components/feedback/ProgressBar.jsx":"4d2e6004c5d0","components/feedback/Skeleton.jsx":"a363b20f85b5","components/feedback/Spinner.jsx":"1b163e93a04f","components/feedback/Toast.jsx":"4910429409d4","components/forms/Field.jsx":"450b5a94c6bf","components/forms/Input.jsx":"87fd964609f6","components/forms/Select.jsx":"729c91059b39","components/forms/Textarea.jsx":"230b0b468043","components/icon/Icon.jsx":"4991b0692c12","components/navigation/Breadcrumbs.jsx":"fc602961e36f","components/navigation/Sidebar.jsx":"bb83c5835a4e","components/navigation/Tabs.jsx":"d7ee3e0a2e62","components/navigation/TopBar.jsx":"a1c67d3615b2","components/status/FilterChip.jsx":"29e9229e03e4","components/status/SeverityBadge.jsx":"c530d4b8751d","components/status/StatusBadge.jsx":"6eeaead18c34","components/surfaces/Card.jsx":"46dcfd4d4b7a","components/surfaces/CommandPalette.jsx":"99849e59ded7","components/surfaces/Dialog.jsx":"8e53934d5390","ui_kits/app/AppShell.jsx":"a6696d646059","ui_kits/app/Dashboard.jsx":"ed921c6b8ef2","ui_kits/app/IncidentDetail.jsx":"e4ec0bd616de","ui_kits/app/Login.jsx":"7c46917d57da","ui_kits/app/Settings.jsx":"790fc2e90163","ui_kits/aurora-loader.js":"1a1b515603eb","ui_kits/marketing/FeatureGrid.jsx":"9d3071ec17d0","ui_kits/marketing/Hero.jsx":"6ca0dabc7a5c","ui_kits/marketing/SiteChrome.jsx":"2bbb4999c52c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_f13b19 = window.DesignSystem_f13b19 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: "var(--control-sm)",
  md: "var(--control-md)",
  lg: "var(--control-lg)"
};
const PX = {
  sm: "var(--control-pad-sm)",
  md: "var(--control-pad-md)",
  lg: "var(--control-pad-lg)"
};
const FS = {
  sm: "var(--text-body-sm-size)",
  md: "var(--text-body-md-size)",
  lg: "var(--text-body-md-size)"
};
const VARIANTS = {
  primary: {
    background: "var(--text-primary)",
    color: "var(--text-inverse)",
    border: "1px solid transparent"
  },
  accent: {
    background: "var(--grad-stop-1)",
    color: "#050810",
    border: "1px solid transparent"
  },
  secondary: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border-default)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid transparent"
  },
  danger: {
    background: "var(--danger)",
    color: "#FFFFFF",
    border: "1px solid transparent"
  }
};

/** Primary is the neutral solid — the signature gradient is never the default primary. */
function Button({
  variant = "secondary",
  size = "md",
  iconLeft,
  iconRight,
  disabled,
  fullWidth,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const v = VARIANTS[variant] || VARIANTS.secondary;
  const hoverStyle = !disabled && hover ? variant === "secondary" || variant === "ghost" ? {
    background: "var(--bg-elevated)",
    borderColor: variant === "secondary" ? "var(--border-strong)" : "transparent"
  } : {
    filter: "brightness(1.08)"
  } : null;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--space-2)",
      height: H[size],
      padding: `0 ${PX[size]}`,
      width: fullWidth ? "100%" : undefined,
      font: "inherit",
      fontFamily: "var(--font-ui)",
      fontSize: FS[size],
      fontWeight: "var(--weight-medium)",
      lineHeight: 1,
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      whiteSpace: "nowrap",
      transition: "background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), filter var(--duration-fast) var(--ease-standard)",
      ...v,
      ...hoverStyle,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const S = {
  sm: 28,
  md: 32,
  lg: 40
};

/** Square icon-only button. `label` is required — it becomes the aria-label. */
function IconButton({
  label,
  size = "md",
  style,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Button, _extends({
    size: size,
    "aria-label": label,
    title: label,
    style: {
      width: S[size],
      padding: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/brand/GradientHeadline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Hero headline: neutral verb, gradient final phrase, full stop inside the gradient run. */
function GradientHeadline({
  lead,
  accent,
  size = 56,
  as = "h1",
  style,
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-bold)",
      fontSize: size,
      lineHeight: 0.95,
      letterSpacing: "-0.03em",
      color: "var(--text-primary)",
      ...style
    }
  }, rest), lead, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--gradient-signature)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent"
    }
  }, accent));
}
Object.assign(__ds_scope, { GradientHeadline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/GradientHeadline.jsx", error: String((e && e.message) || e) }); }

// components/brand/Wordmark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Gradient wordmark. First word(s) neutral, final word carries the signature gradient.
 * No logo mark was supplied with the source system — the wordmark IS the mark.
 */
function Wordmark({
  text = "Aurora",
  size = 20,
  gradientWords = 1,
  style,
  ...rest
}) {
  const words = String(text).trim().split(" ");
  const cut = Math.max(words.length - gradientWords, 0);
  const lead = words.slice(0, cut).join(" ");
  const tail = words.slice(cut).join(" ");
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-bold)",
      fontSize: size,
      lineHeight: 0.95,
      letterSpacing: "-0.03em",
      color: "var(--text-primary)",
      display: "inline-flex",
      gap: "0.25em",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), lead && /*#__PURE__*/React.createElement("span", null, lead), /*#__PURE__*/React.createElement("span", {
    style: {
      background: "var(--gradient-signature)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent"
    }
  }, tail));
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/data/LogViewer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const LEVEL = {
  ERROR: "var(--danger)",
  WARN: "var(--warning)",
  INFO: "var(--info)",
  DEBUG: "var(--text-tertiary)"
};

/** Mono log stream on inset background, alternating 2% rows. */
function LogViewer({
  lines = [],
  height = 200,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      background: "var(--bg-inset)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      height,
      overflow: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-sm-size)",
      lineHeight: "var(--text-mono-sm-lh)",
      ...style
    }
  }, rest), lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: "var(--space-3)",
      padding: "2px var(--space-3)",
      background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent",
      whiteSpace: "pre"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)"
    }
  }, l.ts), /*#__PURE__*/React.createElement("span", {
    style: {
      color: LEVEL[l.level] || "var(--text-secondary)",
      width: 46,
      flex: "0 0 46px"
    }
  }, l.level), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-secondary)"
    }
  }, l.message))));
}
Object.assign(__ds_scope, { LogViewer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/LogViewer.jsx", error: String((e && e.message) || e) }); }

// components/data/Sparkline.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Single-series line, 1.5px, no markers, horizontal-only context. Data-viz color #1 by default. */
function Sparkline({
  values = [],
  width = 220,
  height = 44,
  color = "var(--viz-1)",
  style,
  ...rest
}) {
  const max = Math.max(...values, 1),
    min = Math.min(...values, 0);
  const pts = values.map((v, i) => {
    const x = i / Math.max(values.length - 1, 1) * (width - 2) + 1;
    const y = height - 1 - (v - min) / Math.max(max - min, 1e-6) * (height - 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: width,
    height: height,
    viewBox: `0 0 ${width} ${height}`,
    style: {
      display: "block",
      ...style
    },
    "aria-hidden": "true"
  }, rest), /*#__PURE__*/React.createElement("polyline", {
    points: pts,
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}
Object.assign(__ds_scope, { Sparkline });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Sparkline.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ROW_H = {
  compact: "var(--row-h-compact)",
  default: "var(--row-h)",
  comfortable: "var(--row-h-comfortable)"
};

/**
 * Tables are tables. Hairline dividers, 12px cell padding, sticky header,
 * numeric columns right-aligned with tabular figures. Zebra off by default.
 */
function Table({
  columns = [],
  rows = [],
  density = "default",
  selectedIndex = -1,
  onRowClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(-1);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      overflow: "auto",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      background: "var(--bg-surface)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-sm-size)"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      background: "var(--bg-surface)",
      textAlign: c.numeric ? "right" : "left",
      padding: "0 var(--space-3)",
      height: "var(--row-h)",
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-tertiary)",
      borderBottom: "1px solid var(--border-default)",
      whiteSpace: "nowrap"
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => {
    const selected = i === selectedIndex;
    return /*#__PURE__*/React.createElement("tr", {
      key: i,
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(-1),
      onClick: onRowClick ? () => onRowClick(r, i) : undefined,
      style: {
        height: ROW_H[density],
        background: selected || hover === i ? "var(--bg-elevated)" : "transparent",
        cursor: onRowClick ? "pointer" : "default",
        transition: "background var(--duration-fast) var(--ease-standard)"
      }
    }, columns.map((c, ci) => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        padding: "0 var(--space-3)",
        borderBottom: "1px solid var(--border-subtle)",
        color: c.muted ? "var(--text-secondary)" : "var(--text-primary)",
        textAlign: c.numeric ? "right" : "left",
        fontVariantNumeric: c.numeric ? "tabular-nums" : "normal",
        fontFamily: c.mono ? "var(--font-mono)" : "inherit",
        boxShadow: selected && ci === 0 ? "inset 2px 0 0 var(--grad-stop-1)" : undefined,
        whiteSpace: "nowrap"
      }
    }, typeof c.render === "function" ? c.render(r) : r[c.key])));
  }))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Left-aligned empty state. Icon 48, heading, ≤440px description, one action. */
function EmptyState({
  icon,
  title,
  description,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
      padding: "var(--space-8) var(--space-6)",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-tertiary)",
      display: "flex"
    }
  }, icon), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-sm-size)",
      lineHeight: "var(--text-heading-sm-lh)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 440,
      fontSize: "var(--text-body-sm-size)",
      lineHeight: "var(--text-body-sm-lh)",
      color: "var(--text-secondary)"
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-1)"
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 4px track on inset background, signal-green fill. */
function ProgressBar({
  value = 0,
  label,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "var(--text-caption-size)",
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, Math.round(value), "%")), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": value,
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      height: 4,
      background: "var(--bg-inset)",
      borderRadius: "var(--radius-full)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: `${Math.max(0, Math.min(100, value))}%`,
      background: "var(--grad-stop-1)",
      transition: "width var(--duration-slow) var(--ease-standard)"
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Pulse skeleton, 1s cycle. Match the exact shape of the content it replaces. */
function Skeleton({
  width = "100%",
  height = 12,
  radius = "var(--radius-xs)",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "block",
      width,
      height,
      borderRadius: radius,
      background: "var(--bg-elevated)",
      animation: "aurora-pulse 1s var(--ease-standard) infinite",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 1.5px signal-green ring, 800ms. Only for actions under 5s. */
function Spinner({
  size = 16,
  label = "Loading",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "status",
    "aria-label": label,
    style: {
      display: "inline-block",
      width: size,
      height: size,
      borderRadius: "var(--radius-full)",
      border: "1.5px solid var(--border-strong)",
      borderTopColor: "var(--grad-stop-1)",
      animation: "aurora-spin 800ms linear infinite",
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  success: "var(--success)",
  info: "var(--info)",
  warning: "var(--warning)",
  danger: "var(--danger)"
};

/** Top-right toast: 3px semantic left border, elevated surface. Success/info auto-dismiss. */
function Toast({
  tone = "info",
  title,
  description,
  onClose,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "status",
    style: {
      display: "flex",
      gap: "var(--space-3)",
      width: 340,
      padding: "var(--space-3) var(--space-4)",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderLeft: `3px solid ${TONES[tone]}`,
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-lg)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: "var(--text-body-md-size)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, title), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-secondary)"
    }
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Dismiss",
    onClick: onClose,
    style: {
      all: "unset",
      cursor: "pointer",
      color: "var(--text-tertiary)",
      lineHeight: 1
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Label above (uppercase micro-label), helper or error below. No floating labels. */
function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-label-size)",
      lineHeight: "var(--text-label-lh)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-secondary)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, " *")), children, (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-sm-size)",
      lineHeight: "var(--text-body-sm-lh)",
      color: error ? "var(--danger)" : "var(--text-tertiary)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: "var(--control-sm)",
  md: "var(--control-md)",
  lg: "var(--control-lg)"
};
function Input({
  size = "md",
  invalid,
  mono,
  iconLeft,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const field = /*#__PURE__*/React.createElement("input", _extends({
    onFocus: e => {
      setFocus(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocus(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest, {
    style: {
      width: "100%",
      height: H[size],
      padding: iconLeft ? "0 var(--space-3) 0 30px" : "0 var(--space-3)",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
      fontSize: "var(--text-body-md-size)",
      border: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--border-strong)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-sm)",
      outline: focus ? "2px solid var(--focus-ring)" : "none",
      outlineOffset: 2,
      transition: "border-color var(--duration-fast) var(--ease-standard)",
      ...style
    }
  }));
  if (!iconLeft) return field;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "var(--text-tertiary)",
      display: "flex"
    }
  }, iconLeft), field);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: "var(--control-sm)",
  md: "var(--control-md)",
  lg: "var(--control-lg)"
};
function Select({
  size = "md",
  options = [],
  invalid,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("select", _extends({
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      width: "100%",
      height: H[size],
      padding: "0 var(--space-3)",
      appearance: "none",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-md-size)",
      border: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--border-strong)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-sm)",
      outline: focus ? "2px solid var(--focus-ring)" : "none",
      outlineOffset: 2,
      ...style
    }
  }), options.map(o => {
    const value = typeof o === "string" ? o : o.value;
    const label = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, label);
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  rows = 4,
  invalid,
  mono,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("textarea", _extends({
    rows: rows,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      width: "100%",
      padding: "var(--space-2) var(--space-3)",
      background: "var(--bg-surface)",
      color: "var(--text-primary)",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
      fontSize: "var(--text-body-md-size)",
      lineHeight: "var(--text-body-md-lh)",
      resize: "vertical",
      border: `1px solid ${invalid ? "var(--danger)" : focus ? "var(--border-strong)" : "var(--border-default)"}`,
      borderRadius: "var(--radius-sm)",
      outline: focus ? "2px solid var(--focus-ring)" : "none",
      outlineOffset: 2,
      ...style
    }
  }));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const LUCIDE = "https://unpkg.com/lucide-static@0.395.0/icons/";
const cache = new Map();
function load(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch(LUCIDE + name + ".svg").then(r => r.ok ? r.text() : "").then(t => t.replace(/<!--[\s\S]*?-->/g, "").trim()).catch(() => ""));
  }
  return cache.get(name);
}

/**
 * Icon — Lucide line icons (1.5px stroke, 24px grid), inlined so they inherit currentColor.
 * One weight only; filled variants are reserved for selected states.
 */
function Icon({
  name,
  size = 16,
  color = "currentColor",
  style,
  label,
  ...rest
}) {
  const [svg, setSvg] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    load(name).then(t => {
      if (alive) setSvg(t);
    });
    return () => {
      alive = false;
    };
  }, [name]);
  return /*#__PURE__*/React.createElement("span", _extends({
    role: label ? "img" : "presentation",
    "aria-label": label,
    "aria-hidden": label ? undefined : true,
    dangerouslySetInnerHTML: {
      __html: svg.replace(/width="24"/, `width="${size}"`).replace(/height="24"/, `height="${size}"`).replace(/stroke-width="[\d.]+"/, 'stroke-width="1.5"')
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      flex: "0 0 auto",
      color,
      lineHeight: 0,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Chevron-separated trail, body-sm, tertiary. Last item is current. */
function Breadcrumbs({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    "aria-label": "Breadcrumb",
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-tertiary)",
      ...style
    }
  }, rest), items.map((it, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: it.label
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      color: "var(--text-disabled)"
    }
  }, "\u203A"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: i === items.length - 1 ? "var(--text-primary)" : "var(--text-tertiary)",
      cursor: it.onClick ? "pointer" : "default"
    },
    onClick: it.onClick
  }, it.label))));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 240px expanded / 56px collapsed. Active item: 2px signal-green left rail + elevated fill. */
function Sidebar({
  sections = [],
  activeId,
  collapsed = false,
  onNavigate,
  onToggle,
  footer,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)",
      flex: "0 0 auto",
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border-default)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      transition: "width var(--duration-base) var(--ease-standard)",
      overflow: "hidden",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-3) 0",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, sections.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, !collapsed && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-2) var(--space-4)",
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: "var(--weight-medium)"
    }
  }, s.label), s.items.map(it => {
    const active = it.id === activeId;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      onClick: () => onNavigate && onNavigate(it.id),
      title: it.label,
      style: {
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        height: 32,
        padding: collapsed ? "0 var(--space-5)" : "0 var(--space-4)",
        boxShadow: active ? "inset 2px 0 0 var(--grad-stop-1)" : undefined,
        background: active ? "var(--bg-elevated)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-body-md-size)"
      }
    }, it.icon, !collapsed && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, it.label), !collapsed && it.badge);
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--border-subtle)",
      padding: "var(--space-2) var(--space-3)"
    }
  }, footer, onToggle && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onToggle,
    "aria-label": collapsed ? "Expand sidebar" : "Collapse sidebar",
    style: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      height: 28,
      padding: "0 var(--space-1)",
      color: "var(--text-tertiary)",
      fontSize: "var(--text-body-sm-size)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, collapsed ? "»" : "«"), !collapsed && /*#__PURE__*/React.createElement("span", null, "Collapse"))));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Underline tabs — 2px signal-green active border. Never pill tabs. */
function Tabs({
  tabs = [],
  activeId,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: "flex",
      gap: "var(--space-5)",
      borderBottom: "1px solid var(--border-default)",
      ...style
    }
  }, rest), tabs.map(t => {
    const active = t.id === activeId;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      role: "tab",
      "aria-selected": active,
      type: "button",
      onClick: () => onChange && onChange(t.id),
      style: {
        all: "unset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-3) 0",
        marginBottom: -1,
        borderBottom: `2px solid ${active ? "var(--grad-stop-1)" : "transparent"}`,
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--text-body-md-size)",
        fontWeight: active ? "var(--weight-medium)" : "var(--weight-regular)",
        transition: "color var(--duration-fast) var(--ease-standard)"
      }
    }, t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-sm-size)",
        color: "var(--text-tertiary)"
      }
    }, t.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** 56px bar: wordmark, Cmd+K trigger, environment switcher, notifications, avatar. */
function TopBar({
  product = "Aurora",
  environment = "production",
  environments = ["production", "staging"],
  onCommand,
  onEnvironmentChange,
  right,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("header", _extends({
    style: {
      height: "var(--topbar-h)",
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      padding: "0 var(--space-5)",
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-default)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    text: product,
    size: 18
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onCommand,
    style: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      height: 28,
      width: 260,
      padding: "0 var(--space-3)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-sm)",
      color: "var(--text-tertiary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-sm-size)",
      marginLeft: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Search or jump to\u2026"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-sm-size)"
    }
  }, "\u2318K")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("select", {
    value: environment,
    onChange: e => onEnvironmentChange && onEnvironmentChange(e.target.value),
    style: {
      appearance: "none",
      height: 28,
      padding: "0 var(--space-3)",
      background: "transparent",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-sm)",
      color: "var(--text-secondary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-sm-size)"
    }
  }, environments.map(e => /*#__PURE__*/React.createElement("option", {
    key: e,
    value: e
  }, e))), right);
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/status/FilterChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square-ish filter chip, 24px tall, dismissible when active. */
function FilterChip({
  active,
  onDismiss,
  children,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      height: 24,
      padding: "0 var(--space-2)",
      borderRadius: "var(--radius-sm)",
      border: `1px solid ${active || hover ? "var(--border-strong)" : "var(--border-default)"}`,
      background: active || hover ? "var(--bg-elevated)" : "transparent",
      color: active ? "var(--text-primary)" : "var(--text-secondary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-body-sm-size)",
      cursor: "pointer",
      transition: "background var(--duration-fast) var(--ease-standard)",
      ...style
    }
  }, rest), children, active && onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Remove filter",
    onClick: e => {
      e.stopPropagation();
      onDismiss(e);
    },
    style: {
      all: "unset",
      cursor: "pointer",
      color: "var(--text-tertiary)",
      lineHeight: 1,
      fontSize: 13
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { FilterChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/FilterChip.jsx", error: String((e && e.message) || e) }); }

// components/status/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  success: ["var(--success)", "var(--success-soft)"],
  info: ["var(--info)", "var(--info-soft)"],
  warning: ["var(--warning)", "var(--warning-soft)"],
  danger: ["var(--danger)", "var(--danger-soft)"],
  neutral: ["var(--neutral)", "var(--neutral-soft)"]
};

/** Pill status badge: soft semantic fill, strong semantic text. */
function StatusBadge({
  tone = "neutral",
  dot,
  children,
  style,
  ...rest
}) {
  const [fg, bg] = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      height: 20,
      padding: "0 var(--space-2)",
      borderRadius: "var(--radius-full)",
      background: bg,
      color: fg,
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-caption-size)",
      lineHeight: 1,
      fontWeight: "var(--weight-medium)",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--radius-full)",
      background: fg
    }
  }), children);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/status/SeverityBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const MAP = {
  P1: ["danger", "P1 · Critical"],
  P2: ["warning", "P2 · High"],
  P3: ["info", "P3 · Medium"],
  P4: ["neutral", "P4 · Low"],
  OK: ["success", "Resolved"]
};

/** Severity badge — same pill with a solid 6px dot prefix. Color is never the only signal. */
function SeverityBadge({
  level = "P3",
  label,
  ...rest
}) {
  const [tone, text] = MAP[level] || MAP.P3;
  return /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, _extends({
    tone: tone,
    dot: true
  }, rest), label || text);
}
Object.assign(__ds_scope, { SeverityBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/SeverityBadge.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Panel/card: hairline border, surface background, radius 6. Never nest more than 3 deep. */
function Card({
  eyebrow,
  title,
  action,
  padding = "var(--space-5)",
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding,
      ...style
    }
  }, rest), (title || eyebrow || action) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      marginBottom: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-1)"
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-label-size)",
      lineHeight: "var(--text-label-lh)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)"
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-sm-size)",
      lineHeight: "var(--text-heading-sm-lh)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--text-heading-sm-track)",
      color: "var(--text-primary)"
    }
  }, title)), action), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/brand/KpiTile.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** KPI tile. `gradient` draws the signature ring — one per screen, at most. */
function KpiTile({
  label,
  value,
  unit,
  delta,
  deltaTone = "neutral",
  trend,
  gradient,
  style,
  ...rest
}) {
  const toneColor = {
    up: "var(--success)",
    down: "var(--danger)",
    neutral: "var(--text-secondary)"
  }[deltaTone];
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    padding: "var(--space-4)",
    style: {
      position: "relative",
      overflow: "hidden",
      ...style
    }
  }, rest), gradient && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--radius-md)",
      padding: 1,
      background: "var(--gradient-signature)",
      WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: "var(--weight-medium)",
      marginBottom: "var(--space-2)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-display-md-size)",
      lineHeight: "var(--text-display-md-lh)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--text-display-md-track)",
      fontVariantNumeric: "tabular-nums",
      color: "var(--text-primary)"
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-tertiary)"
    }
  }, unit), delta && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: "var(--text-body-sm-size)",
      color: toneColor,
      fontVariantNumeric: "tabular-nums"
    }
  }, delta)), trend && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Sparkline, {
    values: trend,
    width: 200,
    height: 36
  })));
}
Object.assign(__ds_scope, { KpiTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/KpiTile.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/CommandPalette.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Cmd+K palette: 640 wide, elevated, grouped results, arrow-key navigable. */
function CommandPalette({
  open = true,
  groups = [],
  placeholder = "Search pages, actions, incidents…",
  onClose,
  style,
  ...rest
}) {
  const [query, setQuery] = React.useState("");
  const [index, setIndex] = React.useState(0);
  const flat = React.useMemo(() => groups.flatMap(g => g.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())).map(i => ({
    ...i,
    group: g.label
  }))), [groups, query]);
  React.useEffect(() => {
    setIndex(0);
  }, [query]);
  if (!open) return null;
  const onKey = e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex(i => Math.min(i + 1, flat.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex(i => Math.max(i - 1, 0));
    }
    if (e.key === "Escape" && onClose) onClose();
  };
  let cursor = -1;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--backdrop)",
      display: "flex",
      justifyContent: "center",
      paddingTop: 96,
      zIndex: 50
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 640,
      alignSelf: "flex-start",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: query,
    onChange: e => setQuery(e.target.value),
    onKeyDown: onKey,
    placeholder: placeholder,
    style: {
      width: "100%",
      border: "none",
      outline: "none",
      background: "transparent",
      color: "var(--text-primary)",
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-heading-md-size)",
      lineHeight: "var(--text-heading-md-lh)",
      padding: "var(--space-4) var(--space-5)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 360,
      overflowY: "auto",
      padding: "var(--space-2) 0"
    }
  }, groups.map(g => {
    const items = g.items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
    if (!items.length) return null;
    return /*#__PURE__*/React.createElement("div", {
      key: g.label
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "var(--space-2) var(--space-5)",
        fontSize: "var(--text-label-size)",
        letterSpacing: "var(--text-label-track)",
        textTransform: "uppercase",
        color: "var(--text-tertiary)",
        fontWeight: "var(--weight-medium)"
      }
    }, g.label), items.map(it => {
      cursor += 1;
      const active = cursor === index;
      return /*#__PURE__*/React.createElement("div", {
        key: it.label,
        onMouseEnter: () => setIndex(flat.findIndex(x => x.label === it.label)),
        onClick: it.onSelect,
        style: {
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-2) var(--space-5)",
          cursor: "pointer",
          background: active ? "var(--bg-surface)" : "transparent",
          color: active ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: "var(--text-body-md-size)"
        }
      }, it.icon, /*#__PURE__*/React.createElement("span", {
        style: {
          flex: 1
        }
      }, it.label), it.shortcut && /*#__PURE__*/React.createElement("span", {
        style: {
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-sm-size)",
          color: "var(--text-tertiary)"
        }
      }, it.shortcut));
    }));
  }), !flat.length && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5)",
      color: "var(--text-tertiary)",
      fontSize: "var(--text-body-sm-size)"
    }
  }, "No matches"))));
}
Object.assign(__ds_scope, { CommandPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const W = {
  confirm: 400,
  form: 560,
  detail: 840
};

/** Center-anchored modal. Intent sets max width: confirm 400, form 560, detail 840. */
function Dialog({
  open = true,
  intent = "form",
  title,
  onClose,
  footer,
  children,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--backdrop)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-8)",
      zIndex: 40
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: W[intent],
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-lg)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      padding: "var(--space-4) var(--space-5)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-md-size)",
      lineHeight: "var(--text-heading-md-lh)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--text-heading-md-track)"
    }
  }, title), onClose && /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    label: "Close",
    variant: "ghost",
    size: "sm",
    onClick: onClose
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-5)",
      fontSize: "var(--text-body-md-size)",
      color: "var(--text-secondary)"
    }
  }, children), footer && /*#__PURE__*/React.createElement("footer", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "var(--space-2)",
      padding: "var(--space-4) var(--space-5)",
      borderTop: "1px solid var(--border-subtle)"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Dialog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
/* Aurora — app shell: top bar, sidebar, Cmd+K palette, toast stack. */
function AppShell({
  DS
}) {
  const {
    TopBar,
    Sidebar,
    CommandPalette,
    Toast,
    IconButton,
    Icon,
    StatusBadge
  } = DS;
  const [screen, setScreen] = React.useState("dashboard");
  const [collapsed, setCollapsed] = React.useState(false);
  const [palette, setPalette] = React.useState(false);
  const [toast, setToast] = React.useState(true);
  React.useEffect(() => {
    if (screen === "incident") setToast(false);
  }, [screen]);
  React.useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette(p => !p);
      }
      if (e.key === "Escape") setPalette(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    product: "Aurora Ops",
    onCommand: () => setPalette(true),
    right: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)"
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      label: "Notifications",
      variant: "ghost"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "bell",
      size: 16
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: "var(--radius-full)",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        color: "var(--text-secondary)"
      }
    }, "MI"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flex: 1,
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    collapsed: collapsed,
    onToggle: () => setCollapsed(c => !c),
    activeId: screen,
    onNavigate: setScreen,
    sections: [{
      label: "Operate",
      items: [{
        id: "dashboard",
        label: "Dashboards",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "layout-dashboard",
          size: 16
        })
      }, {
        id: "incident",
        label: "Incidents",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "siren",
          size: 16
        }),
        badge: /*#__PURE__*/React.createElement(StatusBadge, {
          tone: "danger"
        }, "4")
      }, {
        id: "monitors",
        label: "Monitors",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "activity",
          size: 16
        })
      }]
    }, {
      label: "Investigate",
      items: [{
        id: "logs",
        label: "Logs",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "scroll-text",
          size: 16
        })
      }, {
        id: "traces",
        label: "Traces",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "git-branch",
          size: 16
        })
      }]
    }, {
      label: "Manage",
      items: [{
        id: "settings",
        label: "Settings",
        icon: /*#__PURE__*/React.createElement(Icon, {
          name: "settings",
          size: 16
        })
      }]
    }]
  }), /*#__PURE__*/React.createElement("main", {
    className: "aurora-dotgrid",
    style: {
      flex: 1,
      overflow: "auto",
      background: "var(--bg-canvas)"
    }
  }, screen === "dashboard" && /*#__PURE__*/React.createElement(Dashboard, {
    DS: DS,
    onOpenIncident: () => setScreen("incident")
  }), screen === "incident" && /*#__PURE__*/React.createElement(IncidentDetail, {
    DS: DS,
    onBack: () => setScreen("dashboard")
  }), screen === "settings" && /*#__PURE__*/React.createElement(Settings, {
    DS: DS
  }), (screen === "monitors" || screen === "logs" || screen === "traces") && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-6)"
    }
  }, React.createElement(DS.EmptyState, {
    icon: /*#__PURE__*/React.createElement(Icon, {
      name: "inbox",
      size: 48
    }),
    title: "Nothing here yet",
    description: "This surface is stubbed in the kit. Dashboards, Incidents, and Settings are the built screens.",
    action: React.createElement(DS.Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setScreen("dashboard")
    }, "Back to dashboards")
  })))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 68,
      right: 20,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      zIndex: 30
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "danger",
    title: "checkout-api p95 above 1s",
    description: "INC-2841 opened 2m ago.",
    onClose: () => setToast(false)
  })), palette && /*#__PURE__*/React.createElement(CommandPalette, {
    onClose: () => setPalette(false),
    groups: [{
      label: "Pages",
      items: [{
        label: "Dashboards",
        shortcut: "G D",
        onSelect: () => {
          setScreen("dashboard");
          setPalette(false);
        }
      }, {
        label: "Incidents",
        shortcut: "G I",
        onSelect: () => {
          setScreen("incident");
          setPalette(false);
        }
      }, {
        label: "Settings",
        shortcut: "G S",
        onSelect: () => {
          setScreen("settings");
          setPalette(false);
        }
      }]
    }, {
      label: "Actions",
      items: [{
        label: "Acknowledge INC-2841",
        shortcut: "A"
      }, {
        label: "Silence monitor mon_8842",
        shortcut: "S"
      }, {
        label: "Create monitor",
        shortcut: "C"
      }]
    }, {
      label: "Recent",
      items: [{
        label: "checkout-api · p95 latency"
      }, {
        label: "payments-worker · retry queue"
      }]
    }]
  }));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Dashboard.jsx
try { (() => {
/* Aurora — dashboard. KPI grid (one gradient tile), full-width chart panel, recent events table. */
function Dashboard({
  DS,
  onOpenIncident
}) {
  const {
    KpiTile,
    Card,
    Table,
    Sparkline,
    SeverityBadge,
    StatusBadge,
    Button,
    FilterChip,
    Icon
  } = DS;
  const rows = [{
    sev: "P1",
    id: "INC-2841",
    service: "checkout-api",
    summary: "p95 latency above 1s",
    owner: "M. Ito",
    age: "2m ago"
  }, {
    sev: "P2",
    id: "INC-2840",
    service: "payments-worker",
    summary: "Retry queue backing up",
    owner: "S. Novak",
    age: "14m ago"
  }, {
    sev: "P3",
    id: "INC-2839",
    service: "search-indexer",
    summary: "Index lag 4m behind",
    owner: "Unassigned",
    age: "1h ago"
  }, {
    sev: "P4",
    id: "INC-2838",
    service: "notifier",
    summary: "Webhook 429s from vendor",
    owner: "A. Bello",
    age: "3h ago"
  }, {
    sev: "OK",
    id: "INC-2836",
    service: "auth-gateway",
    summary: "Token refresh storm",
    owner: "M. Ito",
    age: "Yesterday, 14:32"
  }];
  const series = [{
    label: "checkout-api",
    color: "var(--viz-1)",
    values: [12, 18, 15, 24, 22, 38, 44, 36, 52, 61, 48, 74]
  }, {
    label: "payments-worker",
    color: "var(--viz-2)",
    values: [8, 9, 11, 10, 14, 12, 18, 16, 22, 19, 25, 23]
  }, {
    label: "auth-gateway",
    color: "var(--viz-3)",
    values: [4, 5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10]
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)",
      maxWidth: "var(--max-app)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: 500
    }
  }, "Production \xB7 us-east-1"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "4px 0 0",
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-lg-size)",
      lineHeight: "var(--text-heading-lg-lh)",
      letterSpacing: "var(--text-heading-lg-track)",
      fontWeight: 600
    }
  }, "Service health")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "calendar-clock",
      size: 14
    })
  }, "Last 24h"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "filter",
      size: 14
    })
  }, "Filters"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "accent"
  }, "Create monitor"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0,1fr))",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(KpiTile, {
    gradient: true,
    label: "p95 latency",
    value: "1,284",
    unit: "ms",
    delta: "+38.2%",
    deltaTone: "down",
    trend: [320, 380, 410, 520, 640, 880, 1284]
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Open incidents",
    value: "4",
    delta: "+2",
    deltaTone: "down",
    trend: [1, 1, 2, 2, 3, 3, 4]
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Error rate",
    value: "4.2",
    unit: "%",
    delta: "+1.8pt",
    deltaTone: "down",
    trend: [0.4, 0.6, 0.9, 1.4, 2.2, 3.1, 4.2]
  }), /*#__PURE__*/React.createElement(KpiTile, {
    label: "Error budget left",
    value: "62",
    unit: "%",
    delta: "\u22129pt",
    deltaTone: "down",
    trend: [98, 94, 88, 81, 74, 68, 62]
  })), /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Last 24h \xB7 5m resolution",
    title: "Request latency by service",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: "var(--space-2)"
      }
    }, /*#__PURE__*/React.createElement(FilterChip, {
      active: true,
      onDismiss: () => {}
    }, "env: production"), /*#__PURE__*/React.createElement(FilterChip, null, "+ Add filter"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      position: "relative",
      height: 180,
      borderLeft: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: `${i * 25}%`,
      height: 1,
      background: "var(--border-subtle)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "stretch"
    }
  }, series.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      position: "absolute",
      inset: 0
    }
  }, /*#__PURE__*/React.createElement(Sparkline, {
    values: s.values,
    color: s.color,
    width: 760,
    height: 180,
    style: {
      width: "100%",
      height: "100%"
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 160,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)",
      fontSize: "var(--text-caption-size)",
      color: "var(--text-secondary)"
    }
  }, series.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 2,
      background: s.color
    }
  }), s.label)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: "var(--space-3)",
      color: "var(--text-tertiary)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-sm-size)"
    }
  }, "p95 \xB7 ms")))), /*#__PURE__*/React.createElement(Card, {
    padding: "0",
    eyebrow: "",
    title: "",
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-4) var(--space-5)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-sm-size)",
      fontWeight: 600
    }
  }, "Recent events"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    tone: "warning",
    dot: true
  }, "Degraded"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 14
    })
  }, "All incidents"))), /*#__PURE__*/React.createElement(Table, {
    density: "default",
    onRowClick: r => onOpenIncident && onOpenIncident(r),
    style: {
      border: "none",
      borderRadius: 0
    },
    columns: [{
      key: "sev",
      label: "Sev",
      render: r => /*#__PURE__*/React.createElement(SeverityBadge, {
        level: r.sev
      })
    }, {
      key: "id",
      label: "Incident",
      mono: true
    }, {
      key: "service",
      label: "Service",
      mono: true
    }, {
      key: "summary",
      label: "Summary"
    }, {
      key: "owner",
      label: "Owner",
      muted: true
    }, {
      key: "age",
      label: "Last update",
      muted: true
    }],
    rows: rows
  })));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/IncidentDetail.jsx
try { (() => {
/* Aurora — incident detail. Left metadata rail, right tabbed pane, collapsible log viewer. */
function IncidentDetail({
  DS,
  onBack
}) {
  const {
    Breadcrumbs,
    Tabs,
    Card,
    SeverityBadge,
    StatusBadge,
    Button,
    IconButton,
    Icon,
    Table,
    LogViewer,
    Sparkline,
    ProgressBar
  } = DS;
  const [tab, setTab] = React.useState("overview");
  const [logsOpen, setLogsOpen] = React.useState(true);
  const timeline = [{
    ts: "14:32",
    who: "Monitor",
    what: "p95 above 1s for 5m — incident opened"
  }, {
    ts: "14:34",
    who: "M. Ito",
    what: "Acknowledged, paging platform on-call"
  }, {
    ts: "14:41",
    who: "S. Novak",
    what: "Rolled back checkout-api to build 4821"
  }, {
    ts: "14:52",
    who: "Monitor",
    what: "p95 recovering, 612ms"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)",
      maxWidth: "var(--max-app)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: [{
      label: "Incidents",
      onClick: onBack
    }, {
      label: "INC-2841"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "bell-off",
      size: 14
    })
  }, "Silence"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "secondary"
  }, "Assign"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "accent"
  }, "Acknowledge"), /*#__PURE__*/React.createElement(IconButton, {
    label: "More actions",
    size: "sm",
    variant: "ghost"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ellipsis",
    size: 16
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(SeverityBadge, {
    level: "P1"
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-lg-size)",
      lineHeight: "var(--text-heading-lg-lh)",
      letterSpacing: "var(--text-heading-lg-track)",
      fontWeight: 600
    }
  }, "checkout-api p95 latency above 1s"), /*#__PURE__*/React.createElement(StatusBadge, {
    tone: "warning",
    dot: true
  }, "Investigating")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "280px minmax(0,1fr)",
      gap: "var(--space-4)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      rowGap: "var(--space-3)",
      columnGap: "var(--space-4)",
      fontSize: "var(--text-body-sm-size)"
    }
  }, [["Owner", "M. Ito"], ["Team", "Platform"], ["Started", "14:32 · 41m ago"], ["Service", "checkout-api"], ["Env", "production"], ["Monitor", "mon_8842"]].map(([k, v]) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: k
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-tertiary)",
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      fontWeight: 500
    }
  }, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: k === "Monitor" || k === "Service" ? "var(--font-mono)" : "inherit"
    }
  }, v))))), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    title: "Error budget"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: 62,
    label: "Monthly budget left"
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "var(--space-4)",
    title: "Timeline"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, timeline.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.ts,
    style: {
      display: "flex",
      gap: "var(--space-3)",
      fontSize: "var(--text-body-sm-size)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-sm-size)",
      color: "var(--text-tertiary)",
      paddingTop: 2
    }
  }, t.ts), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 500
    }
  }, t.who), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-secondary)"
    }
  }, t.what))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    activeId: tab,
    onChange: setTab,
    tabs: [{
      id: "overview",
      label: "Overview"
    }, {
      id: "signals",
      label: "Signals",
      count: 12
    }, {
      id: "runbook",
      label: "Runbook"
    }, {
      id: "comments",
      label: "Comments",
      count: 4
    }]
  }), tab === "overview" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Last 2h",
    title: "p95 latency"
  }, /*#__PURE__*/React.createElement(Sparkline, {
    values: [320, 340, 410, 520, 700, 980, 1284, 1180, 860, 612],
    width: 860,
    height: 120,
    style: {
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement(Table, {
    density: "compact",
    style: {
      border: "none"
    },
    columns: [{
      key: "signal",
      label: "Signal",
      mono: true
    }, {
      key: "value",
      label: "Value",
      numeric: true
    }, {
      key: "baseline",
      label: "Baseline",
      numeric: true,
      muted: true
    }, {
      key: "state",
      label: "State",
      render: r => /*#__PURE__*/React.createElement(StatusBadge, {
        tone: r.tone,
        dot: true
      }, r.state)
    }],
    rows: [{
      signal: "http.request.p95",
      value: "1,284",
      baseline: "412",
      state: "Breaching",
      tone: "danger"
    }, {
      signal: "db.pool.saturation",
      value: "0.94",
      baseline: "0.61",
      state: "Breaching",
      tone: "danger"
    }, {
      signal: "queue.depth",
      value: "8,412",
      baseline: "2,100",
      state: "Elevated",
      tone: "warning"
    }, {
      signal: "cache.hit_ratio",
      value: "0.71",
      baseline: "0.93",
      state: "Elevated",
      tone: "warning"
    }, {
      signal: "cpu.utilization",
      value: "0.58",
      baseline: "0.52",
      state: "Normal",
      tone: "success"
    }]
  }))), tab === "signals" && /*#__PURE__*/React.createElement(Card, {
    title: "Signals"
  }, "Twelve correlated signals \u2014 open the Overview table for detail."), tab === "runbook" && /*#__PURE__*/React.createElement(Card, {
    eyebrow: "checkout-api",
    title: "Latency runbook"
  }, /*#__PURE__*/React.createElement("ol", {
    style: {
      margin: 0,
      paddingLeft: 18,
      color: "var(--text-secondary)",
      fontSize: "var(--text-body-md-size)",
      lineHeight: "var(--text-body-md-lh)",
      maxWidth: "var(--max-reading)"
    }
  }, /*#__PURE__*/React.createElement("li", null, "Check the deploy log for a release in the last 30 minutes."), /*#__PURE__*/React.createElement("li", null, "Compare db pool saturation against the 7-day baseline."), /*#__PURE__*/React.createElement("li", null, "If saturation is above 0.9, scale the pool and roll back the last release."))), tab === "comments" && /*#__PURE__*/React.createElement(Card, {
    title: "Comments"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)",
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-primary)",
      fontWeight: 500
    }
  }, "S. Novak"), " \xB7 14:41 \u2014 Rollback started, build 4821."), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-primary)",
      fontWeight: 500
    }
  }, "M. Ito"), " \xB7 14:52 \u2014 p95 down to 612ms, watching."))), /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--space-3) var(--space-4)",
      borderBottom: logsOpen ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-2)",
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scroll-text",
    size: 14
  }), " Logs \xB7 checkout-api"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    onClick: () => setLogsOpen(o => !o)
  }, logsOpen ? "Collapse" : "Expand")), logsOpen && /*#__PURE__*/React.createElement(LogViewer, {
    height: 150,
    style: {
      border: "none",
      borderRadius: 0
    },
    lines: [{
      ts: "14:32:07",
      level: "ERROR",
      message: "upstream timeout service=payments attempt=3 trace=8f21ab"
    }, {
      ts: "14:32:04",
      level: "WARN",
      message: "db pool saturation 0.94 pool=primary waiters=41"
    }, {
      ts: "14:31:58",
      level: "INFO",
      message: "monitor evaluated id=mon_8842 state=alert"
    }, {
      ts: "14:31:51",
      level: "ERROR",
      message: "request failed status=504 route=/v2/checkout"
    }, {
      ts: "14:31:44",
      level: "DEBUG",
      message: "retry scheduled backoff=1200ms key=chk_88214"
    }, {
      ts: "14:31:39",
      level: "INFO",
      message: "deploy detected build=4822 by=ci-bot"
    }]
  })))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/IncidentDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Login.jsx
try { (() => {
/* Aurora — login. Full-bleed dark canvas, dot grid, 400-wide centered card. */
function Login({
  DS,
  onSignIn
}) {
  const {
    Wordmark,
    Field,
    Input,
    Button,
    Icon
  } = DS;
  return /*#__PURE__*/React.createElement("div", {
    className: "aurora-dotgrid",
    style: {
      minHeight: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-10)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 400,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    text: "Aurora Ops",
    size: 32
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-secondary)"
    }
  }, "Sign in to the production workspace.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--bg-surface)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-6)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "key-round",
      size: 14
    })
  }, "Continue with Okta"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true,
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 14
    })
  }, "Continue with SAML SSO"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      color: "var(--text-tertiary)",
      fontSize: "var(--text-caption-size)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--border-subtle)"
    }
  }), "or continue with email", /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: "var(--border-subtle)"
    }
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Work email"
  }, /*#__PURE__*/React.createElement(Input, {
    type: "email",
    defaultValue: "ops@acme.io"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Password",
    hint: "SSO users can skip this."
  }, /*#__PURE__*/React.createElement(Input, {
    type: "password",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    onClick: onSignIn
  }, "Sign in")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-caption-size)",
      color: "var(--text-tertiary)"
    }
  }, "Trouble signing in? Contact your workspace admin.")));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Settings.jsx
try { (() => {
/* Aurora — settings. Two-column: section nav left, grouped form cards right, sticky save bar when dirty. */
function Settings({
  DS
}) {
  const {
    Card,
    Field,
    Input,
    Select,
    Textarea,
    Button,
    StatusBadge,
    Icon
  } = DS;
  const [section, setSection] = React.useState("notifications");
  const [dirty, setDirty] = React.useState(false);
  const sections = [{
    id: "workspace",
    label: "Workspace"
  }, {
    id: "notifications",
    label: "Notifications"
  }, {
    id: "integrations",
    label: "Integrations"
  }, {
    id: "members",
    label: "Members"
  }, {
    id: "api",
    label: "API keys"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--space-6)",
      maxWidth: 1100,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: 500
    }
  }, "Workspace"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "4px 0 0",
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-lg-size)",
      letterSpacing: "var(--text-heading-lg-track)",
      fontWeight: 600
    }
  }, "Settings")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "200px minmax(0,1fr)",
      gap: "var(--space-6)",
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, sections.map(s => {
    const active = s.id === section;
    return /*#__PURE__*/React.createElement("button", {
      key: s.id,
      type: "button",
      onClick: () => setSection(s.id),
      style: {
        all: "unset",
        cursor: "pointer",
        height: 32,
        padding: "0 var(--space-3)",
        boxShadow: active ? "inset 2px 0 0 var(--grad-stop-1)" : undefined,
        background: active ? "var(--bg-elevated)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: "var(--text-body-md-size)",
        display: "flex",
        alignItems: "center"
      }
    }, s.label);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-4)"
    },
    onChange: () => setDirty(true)
  }, /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Routing",
    title: "Alert routing"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Default channel"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["#ops-alerts", "#platform", "PagerDuty · Platform"]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Escalate after",
    hint: "Unacknowledged P1s escalate to the secondary."
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["5 minutes", "10 minutes", "30 minutes"]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Quiet hours",
    hint: "P3 and P4 only."
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: "22:00 \u2013 07:00 (Europe/Berlin)"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Digest recipients"
  }, /*#__PURE__*/React.createElement(Input, {
    mono: true,
    defaultValue: "ops@acme.io, sre@acme.io"
  })))), /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Thresholds",
    title: "Latency monitor defaults"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "P1 threshold"
  }, /*#__PURE__*/React.createElement(Input, {
    mono: true,
    defaultValue: "p95 > 1000ms for 5m"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "P2 threshold"
  }, /*#__PURE__*/React.createElement(Input, {
    mono: true,
    defaultValue: "p95 > 600ms for 10m"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Evaluation window"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["1 minute", "5 minutes", "15 minutes"]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Notes",
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement(Textarea, {
    rows: 2,
    defaultValue: "Applies to every service without an explicit monitor."
  })))), /*#__PURE__*/React.createElement(Card, {
    eyebrow: "Connected",
    title: "Integrations"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, [["Slack", "success", "Connected"], ["PagerDuty", "success", "Connected"], ["Jira", "neutral", "Not connected"]].map(([name, tone, label]) => /*#__PURE__*/React.createElement("div", {
    key: name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      height: 44,
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plug",
    size: 16,
    color: "var(--text-tertiary)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: "var(--text-body-md-size)"
    }
  }, name), /*#__PURE__*/React.createElement(StatusBadge, {
    tone: tone,
    dot: true
  }, label), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost"
  }, "Manage"))))))), dirty && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "var(--space-2)",
      padding: "var(--space-3) var(--space-4)",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginRight: "auto",
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-secondary)"
    }
  }, "Unsaved changes"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost",
    onClick: () => setDirty(false)
  }, "Discard"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "primary",
    onClick: () => setDirty(false)
  }, "Save changes")));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aurora-loader.js
try { (() => {
/* Resolved against this file, not the page that loads it. */
const AURORA_LOADER_URL = document.currentScript && document.currentScript.src || document.baseURI;

/*
 * Aurora kit loader. Prefers the generated design-system bundle (_ds_bundle.js).
 * If it is not present (e.g. opening a kit as a plain file before the system is
 * compiled) it transpiles the component sources in the browser instead, so the
 * kits always render.
 */
window.loadAurora = async function loadAurora(root, files) {
  const detect = () => {
    for (const k of ["Aurora", "AuroraDS", "DS", "DesignSystem"]) {
      const v = window[k];
      if (v && typeof v === "object" && v.Button && v.Card) return v;
    }
    return null;
  };
  let found = detect();
  if (found) return found;

  // Prefer the compiled design-system bundle when it exists.
  await new Promise(res => {
    const s = document.createElement("script");
    s.src = new URL("../_ds_bundle.js", AURORA_LOADER_URL).href;
    s.onload = s.onerror = res;
    document.head.appendChild(s);
  });
  found = detect();
  if (found) return found;
  const ns = {};
  const sources = await Promise.all(files.map(f => fetch(root + f).then(r => r.text())));
  for (let i = 0; i < files.length; i++) {
    let src = sources[i];
    src = src.replace(/^\s*import .*$/gm, "").replace(/^export\s+/gm, "");
    const names = [...src.matchAll(/^function\s+([A-Z][A-Za-z0-9_]*)/gm)].map(m => m[1]);
    const code = Babel.transform(src, {
      presets: [["react", {
        runtime: "classic"
      }]]
    }).code;
    const known = Object.keys(ns);
    const body = (known.length ? `const { ${known.join(", ")} } = __ns;\n` : "") + code + `\nObject.assign(__ns, { ${names.join(", ")} });`;
    new Function("React", "__ns", body)(window.React, ns);
  }
  return ns;
};
window.AURORA_FILES = ["icon/Icon.jsx", "actions/Button.jsx", "actions/IconButton.jsx", "forms/Field.jsx", "forms/Input.jsx", "forms/Textarea.jsx", "forms/Select.jsx", "status/StatusBadge.jsx", "status/SeverityBadge.jsx", "status/FilterChip.jsx", "surfaces/Card.jsx", "surfaces/Dialog.jsx", "surfaces/CommandPalette.jsx", "data/Table.jsx", "data/LogViewer.jsx", "data/Sparkline.jsx", "brand/Wordmark.jsx", "brand/GradientHeadline.jsx", "brand/KpiTile.jsx", "navigation/Sidebar.jsx", "navigation/TopBar.jsx", "navigation/Tabs.jsx", "navigation/Breadcrumbs.jsx", "feedback/Toast.jsx", "feedback/EmptyState.jsx", "feedback/Skeleton.jsx", "feedback/Spinner.jsx", "feedback/ProgressBar.jsx"];

/*
 * Screen loader for the UI kits. Screens are plain `function Screen({ DS })`
 * declarations (no imports/exports) so they can be transpiled and run directly.
 */
window.loadAuroraScreens = async function loadAuroraScreens(files, root = "./") {
  const sources = await Promise.all(files.map(f => fetch(root + f).then(r => r.text())));
  const ns = {};
  for (let i = 0; i < files.length; i++) {
    const src = sources[i];
    const names = [...src.matchAll(/^function\s+([A-Z][A-Za-z0-9_]*)/gm)].map(m => m[1]);
    const code = Babel.transform(src, {
      presets: [["react", {
        runtime: "classic"
      }]]
    }).code;
    const known = Object.keys(ns);
    const body = (known.length ? `const { ${known.join(", ")} } = __ns;\n` : "") + code + `\nObject.assign(__ns, { ${names.join(", ")} });`;
    new Function("React", "__ns", body)(window.React, ns);
  }
  return ns;
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aurora-loader.js", error: String((e && e.message) || e) }); }

// ui_kits/marketing/FeatureGrid.jsx
try { (() => {
/* Aurora — marketing feature grid + metrics strip. 12-column grid, mixed widths, no hero stacking. */
function FeatureGrid({
  DS
}) {
  const {
    Card,
    Icon,
    StatusBadge,
    Sparkline
  } = DS;
  const features = [{
    icon: "activity",
    title: "One signal graph",
    body: "Metrics, logs, and traces share a single service topology, so correlation is a query — not a meeting."
  }, {
    icon: "siren",
    title: "Incidents that close",
    body: "Severity, owner, runbook, and timeline live on the same page. No dead-end links."
  }, {
    icon: "gauge",
    title: "Dense by default",
    body: "Compact rows, tabular figures, sticky headers. Built for hundreds of rows, not marketing screenshots."
  }, {
    icon: "shield-check",
    title: "Audited access",
    body: "SSO, SCIM, and scoped API keys. Every silence and override is attributed."
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      padding: "0 var(--space-8) var(--space-16)",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: "var(--max-marketing)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(12, 1fr)",
      gap: "var(--grid-gutter)",
      alignItems: "center",
      padding: "var(--space-6) 0",
      borderTop: "1px solid var(--border-subtle)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, [["Mean time to acknowledge", "41s", [9, 7, 8, 6, 5, 4, 3]], ["Signals correlated / min", "18.2k", [4, 6, 7, 9, 11, 14, 18]], ["Alert noise removed", "63%", [2, 3, 5, 6, 8, 10, 12]]].map(([label, value, trend], i) => /*#__PURE__*/React.createElement("div", {
    key: label,
    style: {
      gridColumn: `span 4`,
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: 500
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-display-md-size)",
      fontWeight: 600,
      letterSpacing: "var(--text-display-md-track)",
      fontVariantNumeric: "tabular-nums"
    }
  }, value), /*#__PURE__*/React.createElement(Sparkline, {
    values: trend,
    color: `var(--viz-${i + 1})`,
    width: 110,
    height: 28
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(12, 1fr)",
      gap: "var(--grid-gutter)"
    }
  }, features.map((ft, i) => /*#__PURE__*/React.createElement("div", {
    key: ft.title,
    style: {
      gridColumn: i < 2 ? "span 7" : "span 5"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    style: {
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ft.icon,
    size: 20,
    color: "var(--text-secondary)"
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-md-size)",
      lineHeight: "var(--text-heading-md-lh)",
      letterSpacing: "var(--text-heading-md-track)",
      fontWeight: 600
    }
  }, ft.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 420,
      fontSize: "var(--text-body-md-size)",
      lineHeight: "var(--text-body-md-lh)",
      color: "var(--text-secondary)"
    }
  }, ft.body)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(12, 1fr)",
      gap: "var(--grid-gutter)",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "span 5",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    tone: "info",
    dot: true
  }, "Status page"), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-lg-size)",
      letterSpacing: "var(--text-heading-lg-track)",
      fontWeight: 600
    }
  }, "Ship the incident, not the update email"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-body-md-size)",
      lineHeight: "var(--text-body-md-lh)",
      color: "var(--text-secondary)"
    }
  }, "Public status pages read straight from the incident timeline. One source of truth, two audiences.")), /*#__PURE__*/React.createElement("div", {
    style: {
      gridColumn: "span 7",
      height: 180,
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: "repeating-linear-gradient(135deg, var(--border-subtle) 0 1px, transparent 1px 10px)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-sm-size)",
      color: "var(--text-tertiary)"
    }
  }, "product shot \u2014 status page, 960\xD7540")))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/FeatureGrid.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/Hero.jsx
try { (() => {
/* Aurora — marketing hero. Dark canvas, announcement pill, gradient final word, two CTAs, product shot. */
function Hero({
  DS
}) {
  const {
    GradientHeadline,
    Button,
    Icon
  } = DS;
  return /*#__PURE__*/React.createElement("section", {
    className: "aurora-dotgrid",
    style: {
      padding: "var(--space-20) var(--space-8) var(--space-16)",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: "var(--max-marketing)",
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-6)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "flex-start",
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-2)",
      height: 24,
      padding: "0 var(--space-3)",
      borderRadius: "var(--radius-full)",
      border: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      fontSize: "var(--text-caption-size)",
      color: "var(--text-secondary)"
    }
  }, "New \xB7 Correlated signals is live", /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 12
  })), /*#__PURE__*/React.createElement(GradientHeadline, {
    lead: "Observe everything.",
    accent: "Miss nothing.",
    size: 72,
    style: {
      maxWidth: 820
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 560,
      fontSize: "var(--text-body-lg-size)",
      lineHeight: "var(--text-body-lg-lh)",
      color: "var(--text-secondary)"
    }
  }, "Aurora unifies metrics, logs, traces, and incident response in one dense control surface \u2014 built for operators who work in dark rooms and long shifts."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg"
  }, "Start free trial"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "lg",
    iconRight: /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-right",
      size: 14
    })
  }, "Book a walkthrough")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-8)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: "-1px",
      borderRadius: "var(--radius-lg)",
      background: "var(--gradient-signature)",
      opacity: 0.28,
      filter: "blur(18px)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: 320,
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-default)",
      background: "var(--bg-surface)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundImage: "repeating-linear-gradient(135deg, var(--border-subtle) 0 1px, transparent 1px 10px)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-sm-size)",
      color: "var(--text-tertiary)"
    }
  }, "product shot \u2014 Aurora dashboard, 1440\xD7900")))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/marketing/SiteChrome.jsx
try { (() => {
/* Aurora — marketing header + footer. */
function SiteHeader({
  DS
}) {
  const {
    Wordmark,
    Button
  } = DS;
  const links = ["Product", "Solutions", "Pricing", "Docs", "Changelog"];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      height: "var(--topbar-h)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-6)",
      padding: "0 var(--space-8)",
      background: "var(--bg-canvas)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    text: "Aurora",
    size: 20
  }), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: "var(--space-5)",
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-secondary)"
    }
  }, links.map(l => /*#__PURE__*/React.createElement("span", {
    key: l,
    style: {
      cursor: "pointer"
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "ghost"
  }, "Sign in"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    variant: "accent"
  }, "Start free"));
}
function SiteFooter({
  DS
}) {
  const {
    Wordmark
  } = DS;
  const cols = [{
    label: "Product",
    items: ["Metrics", "Logs", "Traces", "Incidents"]
  }, {
    label: "Company",
    items: ["About", "Careers", "Security", "Status"]
  }, {
    label: "Resources",
    items: ["Docs", "API", "Changelog", "Support"]
  }];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      borderTop: "1px solid var(--border-subtle)",
      padding: "var(--space-10) var(--space-8)",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: "var(--max-marketing)",
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1fr",
      gap: "var(--grid-gutter)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-3)"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    text: "Aurora",
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-caption-size)",
      color: "var(--text-tertiary)",
      maxWidth: 240
    }
  }, "Observability, ITSM, and AIOps in one control surface.")), cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.label,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-label-size)",
      letterSpacing: "var(--text-label-track)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      fontWeight: 500
    }
  }, c.label), c.items.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: "var(--text-body-sm-size)",
      color: "var(--text-secondary)",
      cursor: "pointer"
    }
  }, i))))));
}
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/marketing/SiteChrome.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.GradientHeadline = __ds_scope.GradientHeadline;

__ds_ns.KpiTile = __ds_scope.KpiTile;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.LogViewer = __ds_scope.LogViewer;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.FilterChip = __ds_scope.FilterChip;

__ds_ns.SeverityBadge = __ds_scope.SeverityBadge;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.Dialog = __ds_scope.Dialog;

})();
