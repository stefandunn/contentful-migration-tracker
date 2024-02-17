import { IValidation } from 'contentful-migration';

// Declare as array here for the `disableMarks` method to iterate through
const richTextMarks = [
  'bold',
  'italic',
  'underline',
  'code',
  'superscript',
  'subscript'
] as const;

// Derive type from array
type RichTextMarksTypes = (typeof richTextMarks)[number];

// Declare as array here for the `disableNodes` method to iterate through
const richTextNodes = [
  'heading-1',
  'heading-2',
  'heading-3',
  'heading-4',
  'heading-5',
  'heading-6',
  'ordered-list',
  'unordered-list',
  'hr',
  'table',
  'blockquote',
  'embedded-entry-block',
  'embedded-asset-block',
  'entry-hyperlink',
  'asset-hyperlink',
  'hyperlink',
  'embedded-entry-inline'
] as const;

// Derive type from array
type RichTextNodesTypes = (typeof richTextNodes)[number];

export const enableMarks = (marks: RichTextMarksTypes[]): IValidation => ({
  enabledMarks: marks
});

export const disableMarks = (marks: RichTextMarksTypes[]): IValidation => ({
  enabledMarks: richTextMarks.filter(
    (defaultMark) => !marks.includes(defaultMark)
  )
});

export const enableNodes = (nodes: RichTextNodesTypes[]): IValidation => ({
  enabledNodeTypes: nodes
});

export const disableNodes = (nodes: RichTextNodesTypes[]): IValidation => ({
  enabledNodeTypes: richTextNodes.filter(
    (defaultNode) => !nodes.includes(defaultNode)
  )
});
