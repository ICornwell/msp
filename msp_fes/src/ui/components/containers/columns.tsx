
import React, { PropsWithChildren } from 'react';

import { Container, Stack } from "@mui/material";
import { createContainerComponent } from '../../renderEngine/components/ReComponentWrapper';
import { ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps';

export type ColumnProps = {
  fillDirection: 'across' | 'down';
  columns: 1 | 2 | 3 | 4 | 5 | 6;
} &  ReComponentSystemProps;

export default function Columns(props: ColumnProps & PropsWithChildren) {
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
    const children = (fillDirection === 'across') ?
    // across maths takes every nth child
      paddedChildren.reduce((acc: React.ReactNode[], child: React.ReactNode, i: number) => {
        if (i % (columns-1) === index) {
          acc.push(React.cloneElement(child as React.ReactElement, { key: i }));
        }
        return acc;
      }, []) :
      // down maths takes every total number of children divided by the number of columns blocks
      paddedChildren.reduce((acc: React.ReactNode[], child: React.ReactNode, i: number) => {
        if ((Math.floor(i / (Math.ceil(childCount / columns)))) === index) {
          acc.push(React.cloneElement(child as React.ReactElement, { key: i }));
        }
        return acc;
      }, []);

      return children
  }
  // If there are more columns than children, fill the remaining columns with empty divs

  

  const content = (
    <Container maxWidth={false} disableGutters={true}>
    <Stack direction="row" spacing={2} >
      {Array(columns).fill(0).map((_, index) => (
        <Stack key={index} sx={{ flex: `1 1 ${100 / columns}%`, padding: 1 }}>
          {childrenForColumn(index)}
        </Stack>
      ))}
    </Stack>
    </Container>

  );

  return content;
}

export const ColumnsComponent = createContainerComponent<ColumnProps>(Columns, 'Columns');