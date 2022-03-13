@react.component
let make = (~children) => {
  <div
    className={"p-2 sm:p-4 m-2 sm:m-4 border rounded shadow bg-slate-50 w-full sm:w-96 h-80 sm:h-96"}>
    {children}
  </div>
}
