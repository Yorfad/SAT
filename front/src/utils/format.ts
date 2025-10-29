export const money = (v:number) =>
  new Intl.NumberFormat("es-GT",{style:"currency", currency:"GTQ"}).format(v);

export const ym = (y:number,m:number) =>
  `${y}-${String(m).padStart(2,"0")}`;
