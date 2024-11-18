import React, { useMemo, useRef, useEffect } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import { useHRFormContext } from "../../config/form";
import useFormQueries from "../../queries/forms";
import DataTable from 'react-data-table-component';
import { get } from "lodash";

export default function Comments() {
    const ref = useRef();
    const { control, getValues, formState:{ errors } } = useFormContext();
    const { isDraft, canEdit, activeNav } = useHRFormContext();
    const formId = getValues('formId');
    useEffect(()=>(canEdit&&ref.current)&&ref.current.focus(),[activeNav]);
    return (
        <article>
            {canEdit &&
                <section className="mt-3">
                    <Row as="header">
                        <Col as="h3">Comment</Col>
                    </Row>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Comment:</Form.Label>
                        <Col md={9}>
                            <Controller
                                name="comment"
                                defaultValue=""
                                control={control}
                                render={({field}) => <Form.Control {...field} as="textarea" ref={ref} rows={5} isInvalid={get(errors,'comment',false)}/>}
                            />
                            <Form.Control.Feedback type="invalid">{get(get(errors,'comment',''),'message','')}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                </section>
            }
            {!isDraft && <CommentHistory formId={formId}/>}
        </article>
    );
}

function CommentHistory({formId}) {
    return (
        <section>
            <Row as="header">
                <Col as="h3">Comment History</Col>
            </Row>
            <CommentsTable formId={formId}/>
        </section>
    );
}

export function CommentsTable({formId}) {
    const {getJournal} = useFormQueries(formId);
    const journal = getJournal({select:d=>d.filter(c=>{
        c.id = `${c.FORM_ID}_${c.SEQUENCE}`;
        return !['PA','PF','X'].includes(c.STATUS);
    })});
    const columns = useMemo(() => [
        {name:'Date',selector:row=>row.JOURNAL_DATE},
        {name:'Group',selector:row=>row.GROUP_FROM_NAME},
        {name:'By',selector:row=>row.SUNY_ID,format:row=><>{row.fullName} ({row.SUNY_ID})</>},
        {name:'Comment',grow:3,selector:row=>row.COMMENTS,format:row=><pre className="m-0">{row.COMMENTS}</pre>}
    ],[journal.data]);
    return (
        <Row>
            <Col>
                <DataTable 
                    keyField="id"
                    columns={columns} 
                    data={journal.data}
                    striped 
                    responsive
                    progressPending={journal.isLoading}
                />
            </Col>
        </Row>
    );
}
