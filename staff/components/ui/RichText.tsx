const BOLD_SPAN = /(\*\*[^*]+\*\*)/;
const BOLD_CONTENT = /^\*\*([^*]+)\*\*$/;

export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(BOLD_SPAN).map((segment, index) => {
        const bold = segment.match(BOLD_CONTENT);
        return bold ? (
          <strong key={index} className="font-semibold text-gray-900">
            {bold[1]}
          </strong>
        ) : (
          segment
        );
      })}
    </>
  );
}
