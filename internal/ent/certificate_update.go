// Code generated by ent, DO NOT EDIT.

package ent

import (
	"context"
	"errors"
	"fmt"
	"time"

	"entgo.io/ent/dialect/sql"
	"entgo.io/ent/dialect/sql/sqlgraph"
	"entgo.io/ent/schema/field"
	"github.com/logeable/certmgr/internal/ent/certificate"
	"github.com/logeable/certmgr/internal/ent/namespace"
	"github.com/logeable/certmgr/internal/ent/predicate"
)

// CertificateUpdate is the builder for updating Certificate entities.
type CertificateUpdate struct {
	config
	hooks    []Hook
	mutation *CertificateMutation
}

// Where appends a list predicates to the CertificateUpdate builder.
func (cu *CertificateUpdate) Where(ps ...predicate.Certificate) *CertificateUpdate {
	cu.mutation.Where(ps...)
	return cu
}

// SetNamespaceID sets the "namespace_id" field.
func (cu *CertificateUpdate) SetNamespaceID(i int) *CertificateUpdate {
	cu.mutation.SetNamespaceID(i)
	return cu
}

// SetNillableNamespaceID sets the "namespace_id" field if the given value is not nil.
func (cu *CertificateUpdate) SetNillableNamespaceID(i *int) *CertificateUpdate {
	if i != nil {
		cu.SetNamespaceID(*i)
	}
	return cu
}

// SetCertPem sets the "cert_pem" field.
func (cu *CertificateUpdate) SetCertPem(s string) *CertificateUpdate {
	cu.mutation.SetCertPem(s)
	return cu
}

// SetNillableCertPem sets the "cert_pem" field if the given value is not nil.
func (cu *CertificateUpdate) SetNillableCertPem(s *string) *CertificateUpdate {
	if s != nil {
		cu.SetCertPem(*s)
	}
	return cu
}

// SetKeyPem sets the "key_pem" field.
func (cu *CertificateUpdate) SetKeyPem(s string) *CertificateUpdate {
	cu.mutation.SetKeyPem(s)
	return cu
}

// SetNillableKeyPem sets the "key_pem" field if the given value is not nil.
func (cu *CertificateUpdate) SetNillableKeyPem(s *string) *CertificateUpdate {
	if s != nil {
		cu.SetKeyPem(*s)
	}
	return cu
}

// ClearKeyPem clears the value of the "key_pem" field.
func (cu *CertificateUpdate) ClearKeyPem() *CertificateUpdate {
	cu.mutation.ClearKeyPem()
	return cu
}

// SetDesc sets the "desc" field.
func (cu *CertificateUpdate) SetDesc(s string) *CertificateUpdate {
	cu.mutation.SetDesc(s)
	return cu
}

// SetNillableDesc sets the "desc" field if the given value is not nil.
func (cu *CertificateUpdate) SetNillableDesc(s *string) *CertificateUpdate {
	if s != nil {
		cu.SetDesc(*s)
	}
	return cu
}

// ClearDesc clears the value of the "desc" field.
func (cu *CertificateUpdate) ClearDesc() *CertificateUpdate {
	cu.mutation.ClearDesc()
	return cu
}

// SetIssuerID sets the "issuer_id" field.
func (cu *CertificateUpdate) SetIssuerID(i int) *CertificateUpdate {
	cu.mutation.ResetIssuerID()
	cu.mutation.SetIssuerID(i)
	return cu
}

// SetNillableIssuerID sets the "issuer_id" field if the given value is not nil.
func (cu *CertificateUpdate) SetNillableIssuerID(i *int) *CertificateUpdate {
	if i != nil {
		cu.SetIssuerID(*i)
	}
	return cu
}

// AddIssuerID adds i to the "issuer_id" field.
func (cu *CertificateUpdate) AddIssuerID(i int) *CertificateUpdate {
	cu.mutation.AddIssuerID(i)
	return cu
}

// ClearIssuerID clears the value of the "issuer_id" field.
func (cu *CertificateUpdate) ClearIssuerID() *CertificateUpdate {
	cu.mutation.ClearIssuerID()
	return cu
}

// SetUsage sets the "usage" field.
func (cu *CertificateUpdate) SetUsage(s string) *CertificateUpdate {
	cu.mutation.SetUsage(s)
	return cu
}

// SetNillableUsage sets the "usage" field if the given value is not nil.
func (cu *CertificateUpdate) SetNillableUsage(s *string) *CertificateUpdate {
	if s != nil {
		cu.SetUsage(*s)
	}
	return cu
}

// ClearUsage clears the value of the "usage" field.
func (cu *CertificateUpdate) ClearUsage() *CertificateUpdate {
	cu.mutation.ClearUsage()
	return cu
}

// SetUpdatedAt sets the "updated_at" field.
func (cu *CertificateUpdate) SetUpdatedAt(t time.Time) *CertificateUpdate {
	cu.mutation.SetUpdatedAt(t)
	return cu
}

// SetNamespace sets the "namespace" edge to the Namespace entity.
func (cu *CertificateUpdate) SetNamespace(n *Namespace) *CertificateUpdate {
	return cu.SetNamespaceID(n.ID)
}

// Mutation returns the CertificateMutation object of the builder.
func (cu *CertificateUpdate) Mutation() *CertificateMutation {
	return cu.mutation
}

// ClearNamespace clears the "namespace" edge to the Namespace entity.
func (cu *CertificateUpdate) ClearNamespace() *CertificateUpdate {
	cu.mutation.ClearNamespace()
	return cu
}

// Save executes the query and returns the number of nodes affected by the update operation.
func (cu *CertificateUpdate) Save(ctx context.Context) (int, error) {
	cu.defaults()
	return withHooks(ctx, cu.sqlSave, cu.mutation, cu.hooks)
}

// SaveX is like Save, but panics if an error occurs.
func (cu *CertificateUpdate) SaveX(ctx context.Context) int {
	affected, err := cu.Save(ctx)
	if err != nil {
		panic(err)
	}
	return affected
}

// Exec executes the query.
func (cu *CertificateUpdate) Exec(ctx context.Context) error {
	_, err := cu.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (cu *CertificateUpdate) ExecX(ctx context.Context) {
	if err := cu.Exec(ctx); err != nil {
		panic(err)
	}
}

// defaults sets the default values of the builder before save.
func (cu *CertificateUpdate) defaults() {
	if _, ok := cu.mutation.UpdatedAt(); !ok {
		v := certificate.UpdateDefaultUpdatedAt()
		cu.mutation.SetUpdatedAt(v)
	}
}

// check runs all checks and user-defined validators on the builder.
func (cu *CertificateUpdate) check() error {
	if cu.mutation.NamespaceCleared() && len(cu.mutation.NamespaceIDs()) > 0 {
		return errors.New(`ent: clearing a required unique edge "Certificate.namespace"`)
	}
	return nil
}

func (cu *CertificateUpdate) sqlSave(ctx context.Context) (n int, err error) {
	if err := cu.check(); err != nil {
		return n, err
	}
	_spec := sqlgraph.NewUpdateSpec(certificate.Table, certificate.Columns, sqlgraph.NewFieldSpec(certificate.FieldID, field.TypeInt))
	if ps := cu.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if value, ok := cu.mutation.CertPem(); ok {
		_spec.SetField(certificate.FieldCertPem, field.TypeString, value)
	}
	if value, ok := cu.mutation.KeyPem(); ok {
		_spec.SetField(certificate.FieldKeyPem, field.TypeString, value)
	}
	if cu.mutation.KeyPemCleared() {
		_spec.ClearField(certificate.FieldKeyPem, field.TypeString)
	}
	if value, ok := cu.mutation.Desc(); ok {
		_spec.SetField(certificate.FieldDesc, field.TypeString, value)
	}
	if cu.mutation.DescCleared() {
		_spec.ClearField(certificate.FieldDesc, field.TypeString)
	}
	if value, ok := cu.mutation.IssuerID(); ok {
		_spec.SetField(certificate.FieldIssuerID, field.TypeInt, value)
	}
	if value, ok := cu.mutation.AddedIssuerID(); ok {
		_spec.AddField(certificate.FieldIssuerID, field.TypeInt, value)
	}
	if cu.mutation.IssuerIDCleared() {
		_spec.ClearField(certificate.FieldIssuerID, field.TypeInt)
	}
	if value, ok := cu.mutation.Usage(); ok {
		_spec.SetField(certificate.FieldUsage, field.TypeString, value)
	}
	if cu.mutation.UsageCleared() {
		_spec.ClearField(certificate.FieldUsage, field.TypeString)
	}
	if value, ok := cu.mutation.UpdatedAt(); ok {
		_spec.SetField(certificate.FieldUpdatedAt, field.TypeTime, value)
	}
	if cu.mutation.NamespaceCleared() {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: true,
			Table:   certificate.NamespaceTable,
			Columns: []string{certificate.NamespaceColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(namespace.FieldID, field.TypeInt),
			},
		}
		_spec.Edges.Clear = append(_spec.Edges.Clear, edge)
	}
	if nodes := cu.mutation.NamespaceIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: true,
			Table:   certificate.NamespaceTable,
			Columns: []string{certificate.NamespaceColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(namespace.FieldID, field.TypeInt),
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges.Add = append(_spec.Edges.Add, edge)
	}
	if n, err = sqlgraph.UpdateNodes(ctx, cu.driver, _spec); err != nil {
		if _, ok := err.(*sqlgraph.NotFoundError); ok {
			err = &NotFoundError{certificate.Label}
		} else if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return 0, err
	}
	cu.mutation.done = true
	return n, nil
}

// CertificateUpdateOne is the builder for updating a single Certificate entity.
type CertificateUpdateOne struct {
	config
	fields   []string
	hooks    []Hook
	mutation *CertificateMutation
}

// SetNamespaceID sets the "namespace_id" field.
func (cuo *CertificateUpdateOne) SetNamespaceID(i int) *CertificateUpdateOne {
	cuo.mutation.SetNamespaceID(i)
	return cuo
}

// SetNillableNamespaceID sets the "namespace_id" field if the given value is not nil.
func (cuo *CertificateUpdateOne) SetNillableNamespaceID(i *int) *CertificateUpdateOne {
	if i != nil {
		cuo.SetNamespaceID(*i)
	}
	return cuo
}

// SetCertPem sets the "cert_pem" field.
func (cuo *CertificateUpdateOne) SetCertPem(s string) *CertificateUpdateOne {
	cuo.mutation.SetCertPem(s)
	return cuo
}

// SetNillableCertPem sets the "cert_pem" field if the given value is not nil.
func (cuo *CertificateUpdateOne) SetNillableCertPem(s *string) *CertificateUpdateOne {
	if s != nil {
		cuo.SetCertPem(*s)
	}
	return cuo
}

// SetKeyPem sets the "key_pem" field.
func (cuo *CertificateUpdateOne) SetKeyPem(s string) *CertificateUpdateOne {
	cuo.mutation.SetKeyPem(s)
	return cuo
}

// SetNillableKeyPem sets the "key_pem" field if the given value is not nil.
func (cuo *CertificateUpdateOne) SetNillableKeyPem(s *string) *CertificateUpdateOne {
	if s != nil {
		cuo.SetKeyPem(*s)
	}
	return cuo
}

// ClearKeyPem clears the value of the "key_pem" field.
func (cuo *CertificateUpdateOne) ClearKeyPem() *CertificateUpdateOne {
	cuo.mutation.ClearKeyPem()
	return cuo
}

// SetDesc sets the "desc" field.
func (cuo *CertificateUpdateOne) SetDesc(s string) *CertificateUpdateOne {
	cuo.mutation.SetDesc(s)
	return cuo
}

// SetNillableDesc sets the "desc" field if the given value is not nil.
func (cuo *CertificateUpdateOne) SetNillableDesc(s *string) *CertificateUpdateOne {
	if s != nil {
		cuo.SetDesc(*s)
	}
	return cuo
}

// ClearDesc clears the value of the "desc" field.
func (cuo *CertificateUpdateOne) ClearDesc() *CertificateUpdateOne {
	cuo.mutation.ClearDesc()
	return cuo
}

// SetIssuerID sets the "issuer_id" field.
func (cuo *CertificateUpdateOne) SetIssuerID(i int) *CertificateUpdateOne {
	cuo.mutation.ResetIssuerID()
	cuo.mutation.SetIssuerID(i)
	return cuo
}

// SetNillableIssuerID sets the "issuer_id" field if the given value is not nil.
func (cuo *CertificateUpdateOne) SetNillableIssuerID(i *int) *CertificateUpdateOne {
	if i != nil {
		cuo.SetIssuerID(*i)
	}
	return cuo
}

// AddIssuerID adds i to the "issuer_id" field.
func (cuo *CertificateUpdateOne) AddIssuerID(i int) *CertificateUpdateOne {
	cuo.mutation.AddIssuerID(i)
	return cuo
}

// ClearIssuerID clears the value of the "issuer_id" field.
func (cuo *CertificateUpdateOne) ClearIssuerID() *CertificateUpdateOne {
	cuo.mutation.ClearIssuerID()
	return cuo
}

// SetUsage sets the "usage" field.
func (cuo *CertificateUpdateOne) SetUsage(s string) *CertificateUpdateOne {
	cuo.mutation.SetUsage(s)
	return cuo
}

// SetNillableUsage sets the "usage" field if the given value is not nil.
func (cuo *CertificateUpdateOne) SetNillableUsage(s *string) *CertificateUpdateOne {
	if s != nil {
		cuo.SetUsage(*s)
	}
	return cuo
}

// ClearUsage clears the value of the "usage" field.
func (cuo *CertificateUpdateOne) ClearUsage() *CertificateUpdateOne {
	cuo.mutation.ClearUsage()
	return cuo
}

// SetUpdatedAt sets the "updated_at" field.
func (cuo *CertificateUpdateOne) SetUpdatedAt(t time.Time) *CertificateUpdateOne {
	cuo.mutation.SetUpdatedAt(t)
	return cuo
}

// SetNamespace sets the "namespace" edge to the Namespace entity.
func (cuo *CertificateUpdateOne) SetNamespace(n *Namespace) *CertificateUpdateOne {
	return cuo.SetNamespaceID(n.ID)
}

// Mutation returns the CertificateMutation object of the builder.
func (cuo *CertificateUpdateOne) Mutation() *CertificateMutation {
	return cuo.mutation
}

// ClearNamespace clears the "namespace" edge to the Namespace entity.
func (cuo *CertificateUpdateOne) ClearNamespace() *CertificateUpdateOne {
	cuo.mutation.ClearNamespace()
	return cuo
}

// Where appends a list predicates to the CertificateUpdate builder.
func (cuo *CertificateUpdateOne) Where(ps ...predicate.Certificate) *CertificateUpdateOne {
	cuo.mutation.Where(ps...)
	return cuo
}

// Select allows selecting one or more fields (columns) of the returned entity.
// The default is selecting all fields defined in the entity schema.
func (cuo *CertificateUpdateOne) Select(field string, fields ...string) *CertificateUpdateOne {
	cuo.fields = append([]string{field}, fields...)
	return cuo
}

// Save executes the query and returns the updated Certificate entity.
func (cuo *CertificateUpdateOne) Save(ctx context.Context) (*Certificate, error) {
	cuo.defaults()
	return withHooks(ctx, cuo.sqlSave, cuo.mutation, cuo.hooks)
}

// SaveX is like Save, but panics if an error occurs.
func (cuo *CertificateUpdateOne) SaveX(ctx context.Context) *Certificate {
	node, err := cuo.Save(ctx)
	if err != nil {
		panic(err)
	}
	return node
}

// Exec executes the query on the entity.
func (cuo *CertificateUpdateOne) Exec(ctx context.Context) error {
	_, err := cuo.Save(ctx)
	return err
}

// ExecX is like Exec, but panics if an error occurs.
func (cuo *CertificateUpdateOne) ExecX(ctx context.Context) {
	if err := cuo.Exec(ctx); err != nil {
		panic(err)
	}
}

// defaults sets the default values of the builder before save.
func (cuo *CertificateUpdateOne) defaults() {
	if _, ok := cuo.mutation.UpdatedAt(); !ok {
		v := certificate.UpdateDefaultUpdatedAt()
		cuo.mutation.SetUpdatedAt(v)
	}
}

// check runs all checks and user-defined validators on the builder.
func (cuo *CertificateUpdateOne) check() error {
	if cuo.mutation.NamespaceCleared() && len(cuo.mutation.NamespaceIDs()) > 0 {
		return errors.New(`ent: clearing a required unique edge "Certificate.namespace"`)
	}
	return nil
}

func (cuo *CertificateUpdateOne) sqlSave(ctx context.Context) (_node *Certificate, err error) {
	if err := cuo.check(); err != nil {
		return _node, err
	}
	_spec := sqlgraph.NewUpdateSpec(certificate.Table, certificate.Columns, sqlgraph.NewFieldSpec(certificate.FieldID, field.TypeInt))
	id, ok := cuo.mutation.ID()
	if !ok {
		return nil, &ValidationError{Name: "id", err: errors.New(`ent: missing "Certificate.id" for update`)}
	}
	_spec.Node.ID.Value = id
	if fields := cuo.fields; len(fields) > 0 {
		_spec.Node.Columns = make([]string, 0, len(fields))
		_spec.Node.Columns = append(_spec.Node.Columns, certificate.FieldID)
		for _, f := range fields {
			if !certificate.ValidColumn(f) {
				return nil, &ValidationError{Name: f, err: fmt.Errorf("ent: invalid field %q for query", f)}
			}
			if f != certificate.FieldID {
				_spec.Node.Columns = append(_spec.Node.Columns, f)
			}
		}
	}
	if ps := cuo.mutation.predicates; len(ps) > 0 {
		_spec.Predicate = func(selector *sql.Selector) {
			for i := range ps {
				ps[i](selector)
			}
		}
	}
	if value, ok := cuo.mutation.CertPem(); ok {
		_spec.SetField(certificate.FieldCertPem, field.TypeString, value)
	}
	if value, ok := cuo.mutation.KeyPem(); ok {
		_spec.SetField(certificate.FieldKeyPem, field.TypeString, value)
	}
	if cuo.mutation.KeyPemCleared() {
		_spec.ClearField(certificate.FieldKeyPem, field.TypeString)
	}
	if value, ok := cuo.mutation.Desc(); ok {
		_spec.SetField(certificate.FieldDesc, field.TypeString, value)
	}
	if cuo.mutation.DescCleared() {
		_spec.ClearField(certificate.FieldDesc, field.TypeString)
	}
	if value, ok := cuo.mutation.IssuerID(); ok {
		_spec.SetField(certificate.FieldIssuerID, field.TypeInt, value)
	}
	if value, ok := cuo.mutation.AddedIssuerID(); ok {
		_spec.AddField(certificate.FieldIssuerID, field.TypeInt, value)
	}
	if cuo.mutation.IssuerIDCleared() {
		_spec.ClearField(certificate.FieldIssuerID, field.TypeInt)
	}
	if value, ok := cuo.mutation.Usage(); ok {
		_spec.SetField(certificate.FieldUsage, field.TypeString, value)
	}
	if cuo.mutation.UsageCleared() {
		_spec.ClearField(certificate.FieldUsage, field.TypeString)
	}
	if value, ok := cuo.mutation.UpdatedAt(); ok {
		_spec.SetField(certificate.FieldUpdatedAt, field.TypeTime, value)
	}
	if cuo.mutation.NamespaceCleared() {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: true,
			Table:   certificate.NamespaceTable,
			Columns: []string{certificate.NamespaceColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(namespace.FieldID, field.TypeInt),
			},
		}
		_spec.Edges.Clear = append(_spec.Edges.Clear, edge)
	}
	if nodes := cuo.mutation.NamespaceIDs(); len(nodes) > 0 {
		edge := &sqlgraph.EdgeSpec{
			Rel:     sqlgraph.M2O,
			Inverse: true,
			Table:   certificate.NamespaceTable,
			Columns: []string{certificate.NamespaceColumn},
			Bidi:    false,
			Target: &sqlgraph.EdgeTarget{
				IDSpec: sqlgraph.NewFieldSpec(namespace.FieldID, field.TypeInt),
			},
		}
		for _, k := range nodes {
			edge.Target.Nodes = append(edge.Target.Nodes, k)
		}
		_spec.Edges.Add = append(_spec.Edges.Add, edge)
	}
	_node = &Certificate{config: cuo.config}
	_spec.Assign = _node.assignValues
	_spec.ScanValues = _node.scanValues
	if err = sqlgraph.UpdateNode(ctx, cuo.driver, _spec); err != nil {
		if _, ok := err.(*sqlgraph.NotFoundError); ok {
			err = &NotFoundError{certificate.Label}
		} else if sqlgraph.IsConstraintError(err) {
			err = &ConstraintError{msg: err.Error(), wrap: err}
		}
		return nil, err
	}
	cuo.mutation.done = true
	return _node, nil
}
