@react.component
let make = (~children=React.null, ~onClick=_ => ()) =>
  <button
    type_="button"
    className="p-2 flex gap-2 items-center border border-gray rounded shadow bg-gray-50 hover:bg-gray-200 active:bg-gray-100"
    onClick>
    {children}
  </button>
