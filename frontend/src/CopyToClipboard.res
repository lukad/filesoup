let copy: string => unit = %raw(`(content) => navigator.clipboard.writeText(content)`)

@react.component
let make = (~content) => {
  <>
    <input disabled=true value={content} />
    <button onClick={_ => copy(content)}> {"Copy"->React.string} </button>
  </>
}
