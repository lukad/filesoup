@react.component
let make = (~label, ~detail="", ~progress) => <>
  <div className="w-full flex justify-between mb-1">
    <span className="text-base font-medium"> {label->React.string} </span>
    <span className="text-sm font-medium"> {detail->React.string} </span>
    <span className="text-sm font-medium"> {`${progress->string_of_int}%`->React.string} </span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-gray-600 h-2.5 rounded-full transition-all"
      style={ReactDOM.Style.make(~width=`${progress->string_of_int}%`, ())}
    />
  </div>
</>
