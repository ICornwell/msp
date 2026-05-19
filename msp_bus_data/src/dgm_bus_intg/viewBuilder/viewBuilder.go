package viewbuilder

import (
	"dgm_bus_intg/utils"
	"encoding/json"
)

// Element contains the common fields for any element type
type Element struct {
	Object             string     `json:"object"`
	QueryObjectId      string     `json:"queryObjectId"`
	IsCollection       bool       `json:"isCollection"`
	RelationFromParent string     `json:"relationFromParent,omitempty"`
	SubElements        []*Element `json:"subElements,omitempty"`
}

// View represents the top-level view structure
type View struct {
	Name        string   `json:"name"`
	Version     string   `json:"version"`
	RootKey     string   `json:"rootKey"`
	RootElement *Element `json:"rootElement"`
}

// Query is the top-level query structure
type Query struct {
	View *View `json:"view"`
}

// ElementBuilder provides common methods for element data builders
type ElementBuilder struct {
	parentElement *ElementBuilder
	parentView    *ViewBuilder
	element       *Element
}

// WithQueryObjectId sets the query object ID
func (b *ElementBuilder) WithOwnQueryObjectId(id string) *ElementBuilder {
	b.element.QueryObjectId = id
	return b
}

// WithRelationFromParent sets the relation from parent
func (b *ElementBuilder) WithRelationFromParent(relation string) *ElementBuilder {
	b.element.RelationFromParent = relation
	return b
}

// AddSubElement adds a sub-element to this element
func (b *ElementBuilder) AddSubElement(elementType string) *ElementBuilder {
	subElement := &Element{
		Object: elementType,
		QueryObjectId: utils.GenerateId(),
		IsCollection: false,
	}
	if b.element.SubElements == nil {
		b.element.SubElements = make([]*Element, 0)
	}
	b.element.SubElements = append(b.element.SubElements, subElement)

	return &ElementBuilder{
		element: subElement,
	}
}

// AddSubElement adds a sub-element to this element
func (b *ElementBuilder) AddSubElementsCollection(elementType string) *ElementBuilder {
	subElement := &Element{
		Object: elementType,
		QueryObjectId: utils.GenerateId(),
		IsCollection: true,
	}
	if b.element.SubElements == nil {
		b.element.SubElements = make([]*Element, 0)
	}
	b.element.SubElements = append(b.element.SubElements, subElement)

	return &ElementBuilder{
		element: subElement,
	}
}

// Build returns the built Element
func (b *ElementBuilder) EndElement() *ElementBuilder {
	return b.parentElement
}

// Build returns the built Element
func (b *ElementBuilder) EndAllElements() *ViewBuilder {
	return b.parentView
}

func (b *ViewBuilder) EndView() *QueryBuilder {
	return b.parentQuery
}

// ViewBuilder builds View structures
type ViewBuilder struct {
	parentQuery *QueryBuilder
	view        *View
}

// WithName sets the view name
func (b *ViewBuilder) WithName(name string, version string) *ViewBuilder {
	b.view.Name = name
	b.view.Version = version
	return b
}

// WithRootKey sets the root key
func (b *ViewBuilder) WithRootKey(rootKey string) *ViewBuilder {
	b.view.RootKey = rootKey
	return b
}

// WithRootElement creates a root element builder
func (b *ViewBuilder) WithRootElement(elementType string) *ElementBuilder {
	element := &Element{
		Object: elementType,
		QueryObjectId: utils.GenerateId(),
		IsCollection: false,
	}
	b.view.RootElement = element

	eb := &ElementBuilder{
		parentView: b,
		element:    element,
	}

	return eb
}

// QueryBuilder builds Query structures
type QueryBuilder struct {
	query *Query
}

// DefineView creates a view builder
func (b *QueryBuilder) DefineView() *ViewBuilder {
	view := &View{}
	b.query.View = view

	return &ViewBuilder{
		parentQuery: b,
		view:        view,
	}
}

// Build returns the built Query
func (b *QueryBuilder) Build() *Query {
	return b.query
}

// JSON returns the JSON representation of the query
func (b *QueryBuilder) JSON() (string, error) {
	bytes, err := json.MarshalIndent(b.query, "", "    ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// New creates a new query builder
func New() *QueryBuilder {
	return &QueryBuilder{
		query: &Query{},
	}
}
