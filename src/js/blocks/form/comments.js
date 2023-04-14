import React, { useMemo } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useFormContext } from "react-hook-form";
import { useHRFormContext } from "../../config/form";
import useFormQueries from "../../queries/forms";
import DataTable from 'react-data-table-component';


export default function Comments() {
    const { control, getValues } = useFormContext();
    const { isDraft, readOnly } = useHRFormContext();
    const formId = getValues('formId');
    return (
        <article>
            {!readOnly &&
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
                                render={({field}) => <Form.Control {...field} as="textarea" rows={5}/>}
                            />
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

function CommentsTable({formId}) {
    const {getJournal} = useFormQueries(formId);
    const journal = getJournal({select:d=>d.filter(c=>{
        c.id = `${c.FORM_ID}_${c.SEQUENCE}`;
        return c.STATUS!='X';
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
