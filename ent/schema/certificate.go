package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

// Certificate holds the schema definition for the Certificate entity.
type Certificate struct {
	ent.Schema
}

// Fields of the Certificate.
func (Certificate) Fields() []ent.Field {
	return []ent.Field{
		field.Text("id"),
		field.Text("namespace"),
		field.Text("type"), // ROOT, INTERMEDIATE, LEAF
		field.Text("cert_pem"),
		field.Text("key_pem").Optional(),
		field.Time("updated_at").
			Default(time.Now).
			UpdateDefault(time.Now),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

// Edges of the Certificate.
func (Certificate) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("namespace_ref", Namespace.Type).
			Ref("certificates").
			Field("namespace").
			Unique().
			Required(),
	}
}

// Indexes of the Certificate.
func (Certificate) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("namespace"),
		index.Fields("type"),
	}
}
