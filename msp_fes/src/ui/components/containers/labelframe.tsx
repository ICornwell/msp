
import React, { PropsWithChildren } from 'react';

import { createContainerComponent, createExtendedComponent } from '../../renderEngine/components/ReComponentWrapper';
import { ReComponentCommonProps } from '../../renderEngine/components/ReComponentProps';
import { styled, SvgIcon } from '@mui/material';
import { ElementSetContainerExtension, extendWithElementSetContainer } from '../../renderEngine/components/ContainerElements';

export type LabelFrameProps = {
  icon?: React.ElementType;
};

const MainDiv = styled('div')(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    margin: theme.spacing(2, 0),
    backgroundColor: theme.palette.background.paper,
}));

const HeaderDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
     backgroundColor: theme.palette.primary.light,
}));

const HeaderBorderBeforeDiv = styled('div')(({ theme }) => ({
    flexGrow: 1,
    height: '1px',
    backgroundColor: theme.palette.text.secondary,
}));

const HeaderTitleDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(0, 2),
}));

const TitleSpan = styled('span')(({ theme }) => ({
    marginLeft: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.subtitle1.fontSize,
    color: theme.palette.text.primary,
   
}));

const HeaderBorderAfterDiv = styled('div')(({ theme }) => ({
    flexGrow: 1,
    height: '1px',
    backgroundColor: theme.palette.text.secondary,
}));

const ChildrenContainerDiv = styled('div')(({ theme }) => ({
    padding: theme.spacing(2),
}));



export default function LabelFrame(props: LabelFrameProps & PropsWithChildren & ReComponentCommonProps) {
  const { label, icon, children } = props;

 return (
        <MainDiv>
            <HeaderDiv>
                <HeaderBorderBeforeDiv></HeaderBorderBeforeDiv>
                {(icon || label) && (
                    <HeaderTitleDiv>
                        {icon && <SvgIcon component={icon} />}
                        {label && <TitleSpan>{label}</TitleSpan>}
                    </HeaderTitleDiv>
                )}
                <HeaderBorderAfterDiv></HeaderBorderAfterDiv>
            </HeaderDiv>
            <ChildrenContainerDiv>{children}</ChildrenContainerDiv>
        </MainDiv>
    );
}

// export const LabelFrameComponent = createContainerComponent<LabelFrameProps & ReComponentCommonProps & PropsWithChildren>(LabelFrame, 'LabelFrame');

export const LabelFrameComponent = createExtendedComponent<LabelFrameProps & ReComponentCommonProps & PropsWithChildren, ElementSetContainerExtension<any>>(
  LabelFrame, 
  'LabelFrame',
  (builder, dataDescriptor, contextPlaceHolder) => extendWithElementSetContainer(builder, dataDescriptor, contextPlaceHolder)
);