import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type TextareaHTMLAttributes,
  type UIEventHandler,
} from 'react';

type LinedTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  wrapperClassName?: string;
  lineOffset?: number;
};

const LinedTextArea = forwardRef<HTMLTextAreaElement, LinedTextAreaProps>(
  ({ value = '', wrapperClassName = '', className = '', lineOffset = 1, onScroll, ...rest }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const normalizedValue =
      typeof value === 'string' ? value : value != null ? String(value) : '';

    useImperativeHandle(ref, () => textareaRef.current);

    const lineNumbers = useMemo(() => {
      const lines = normalizedValue.split(/\r\n|\r|\n/).length;
      return Array.from({ length: Math.max(lines, 1) }, (_, index) => lineOffset + index);
    }, [normalizedValue, lineOffset]);

    useEffect(() => {
      const textarea = textareaRef.current;
      const gutter = gutterRef.current;
      if (!textarea || !gutter) {
        return;
      }
      gutter.scrollTop = textarea.scrollTop;
    }, [normalizedValue, lineNumbers]);

    const handleScroll: UIEventHandler<HTMLTextAreaElement> = (event) => {
      if (onScroll) {
        onScroll(event);
      }
      if (gutterRef.current) {
        gutterRef.current.scrollTop = event.currentTarget.scrollTop;
      }
    };

    return (
      <div className={`lined-textarea ${wrapperClassName}`.trim()}>
        <div className="lined-textarea__gutter" aria-hidden="true" ref={gutterRef}>
          {lineNumbers.map((lineNumber) => (
            <span key={lineNumber}>{lineNumber}</span>
          ))}
        </div>
        <textarea
          {...rest}
          ref={textareaRef}
          className={className}
          value={normalizedValue}
          onScroll={handleScroll}
        />
      </div>
    );
  },
);

LinedTextArea.displayName = 'LinedTextArea';

export default LinedTextArea;
