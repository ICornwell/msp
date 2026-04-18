import { DeepPartial, Flatten } from '../../fluent/builderUtils.js';
import { DomainObject, versionedResourceId } from './data.js';

export type SubElement = ViewElement<DomainObject<any, any>>; 

/// ViewElement - defines an element within a View hierarchy, based on a Schema, extended with sub-elements
export interface ViewElement<
    DO extends DomainObject<any, any> = any>  {
    object: string;
    queryObjectId: string;
    domainObjectId: versionedResourceId;  // Serialisable reference to schema
    domainObject?: DO // Optional full schema reference
    relationFromParent?: string;
    subElements?: SubElement[];
    isCollection: boolean;
    isEntity: boolean;  // Indicates if this element represents an entity (root of a graph) or just a value object
}

export interface View<VT extends Flatten<any> = any>  {
    targetDataStore?: string;
    name: string;
    version: string;
    varaintName?: string;
    configSet: string;
    rootKey: string;
    rootElement: SubElement;
    domain?: versionedResourceId;  // Added when bound to product
    product?: versionedResourceId;  // Added when bound to product
    dataType?: DeepPartial<VT> 
    viewDataIdentifier: versionedResourceId; // Serialisable reference to the viewDataIdentifier that will be used for this view's data at runtime

}


