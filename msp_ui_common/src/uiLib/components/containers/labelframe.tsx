
import React, { PropsWithChildren } from 'react';

import { createExtendedComponent } from '../../renderEngine/components/ReComponentWrapper.js';
import { ReComponentCommonProps } from '../../renderEngine/components/ReComponentProps.js';
import { styled, SvgIcon } from '@mui/material';
import { ElementSetContainerExtension, extendWithElementSetContainer } from '../../renderEngine/components/ContainerElements.js';
import { CNTX } from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';

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
// NB. compiler warnings/errors relating to generic typing of 'extendWithElementSetContainer'
// are due to other errors breaking inference - the code is usually correct.
// fix all other errors in this file, and all other fluent extension factories,
// before attempting to address generic typing issues with the extension functions.
// sometimes they can take a while to resolve even after the underlying issues are fixed.
export const LabelFrameComponent = createExtendedComponent<LabelFrameProps & ReComponentCommonProps & PropsWithChildren, ElementSetContainerExtension<CNTX, any>>(
  LabelFrame, 
  'LabelFrame',
   extendWithElementSetContainer
);