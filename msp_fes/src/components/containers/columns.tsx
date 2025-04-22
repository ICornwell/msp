
import { ComponentChildren } from 'preact';
import { PropsWithChildren } from 'preact/compat';

import { Stack } from "@mui/material";

export default function Columns(props: {
  columns: 1 | 2 | 3 | 4 | 5 | 6;
  fillDirection: 'across' | 'down';
} & PropsWithChildren) {
  const { columns, fillDirection, children } = props;

  if (!children) {
    return null;
  }
  const arrayChildren = Array.isArray(children) ? children : [children];

  // easily pad the children with empty divs
  // if there are less children than columns
  const paddedChildren = (arrayChildren.length < columns) ?
    [...arrayChildren, ...(Array.from({ length: columns - arrayChildren.length },
      (_, i) => <div key={i} />))]
    : arrayChildren;


  const childCount = paddedChildren.length

  function childrenForColumn(index: number) {
    return (fillDirection === 'across') ?
    // across maths takes every nth child
      paddedChildren.reduce((acc: ComponentChildren[], child: ComponentChildren, i: number) => {
        if (i % (columns-1) === index) {
          acc.push(child);
        }
        return acc;
      }, []) :
      // down maths takes every total number of children divided by the number of columns blocks
      paddedChildren.reduce((acc: ComponentChildren[], child: ComponentChildren, i: number) => {
        if ((Math.floor(i / (Math.ceil(childCount / columns)))) === index) {
          acc.push(child);
        }
        return acc;
      }, []);
  }
  // If there are more columns than children, fill the remaining columns with empty divs


  return (
    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
      {Array(columns).fill(0).map((_, index) => (
        <Stack key={index} sx={{ flex: `0 0 ${100 / columns}%`, padding: 1 }}>
          {childrenForColumn(index)}
        </Stack>
      ))}
    </Stack>

  );
}