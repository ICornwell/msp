import { DeepPartial, Flatten } from '../../fluent/builderUtils.js';
import { DomainObject, versionedResourceId } from './data.js';
import type { ViewDataIdentifier, ViewIdentifier } from '../../../types/index.js';

export type SubElement = ViewElement<DomainObject<any, any>>; 

/// ViewElement - defines an element within a View hierarchy, based on a Schema, extended with sub-elements
export interface ViewElement<
    DO extends DomainObject<any, any, any> = any, RSN extends string = string>  {
    object: string;
    queryObjectId: string;
    docPathName?: string; // The path name to use when this element is a child of another element, used for mapping to data structure
    domainObjectId: versionedResourceId;  // Serialisable reference to schema
    domainObject?: DO // Optional full schema reference
    relationFromParent?: string;
    subElements?: SubElement[];
    isCollection: boolean;
    isEntity: boolean;  // Indicates if this element represents an entity (root of a graph) or just a value object
    isRecurseStartPoint?: boolean; // Indicates if this element is the start point of a recursive relationship (i.e. it has a parent element with the same schema)
    isRecurseEndPoint?: boolean; // Indicates if this element is the end point of a recursive relationship (i.e. it has a child element with the same schema that is marked as the start point)
    recurseLevel?: number; // Used to track the current level of recursion when processing the view, to prevent infinite loops and to allow for depth-limited recursion
    recurseStartName?: RSN; // Used to track the name of the recurse start point element when processing the view, to allow for multiple recursive relationships within the same view
}

export interface View<VT extends Flatten<any> = any>  {
    targetDataStore?: string;
    namespace?: string;
    name: string;
    version: string;
    variantName?: string;
    configSet: string;
    rootKey: string | string[] | ((data: any) => string);
    rootElement: SubElement;
    dataType?: DeepPartial<VT> 
    viewDataIdentifier: versionedResourceId; // Serialisable reference to the viewDataIdentifier that will be used for this view's data at runtime
    getViewIdentifier: () => ViewIdentifier;
    getViewDataIdentifier: (dataKey: string, recordId?: string) => ViewDataIdentifier;

}


