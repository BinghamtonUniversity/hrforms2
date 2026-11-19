import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { CommentsTable } from "../comments";
import { useHRFormContext } from "../../../config/form";

export default function ReviewComments() {
    const { getValues } = useFormContext();
    const { isDraft } = useHRFormContext();
    return (
        <section className="mb-4">
            <Row as="header">
                <Col>
                    <h4 className="border-bottom border-main">Comments</h4>
                </Col>
            </Row>
            <article>
                <pre>
                    {getValues(['comment'])}
                </pre>
            </article>
            {!isDraft &&
                <article>
                    <Row as="header">
                        <Col as="h5">History</Col>
                    </Row>
                    <CommentsTable formId={getValues('formId')}/>
                </article>
            }
        </section>
    );
}