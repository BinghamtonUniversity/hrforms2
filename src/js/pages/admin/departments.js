import React from "react";
import { Row, Col } from "react-bootstrap";
import { t } from "../../config/text";

export default function AdminDepartments() {
    return (
        <>
            <Row>
                <Col><h2>{t('admin.departments.title')}</h2></Col>
            </Row>
            <Row>
                <Col>coming soon...</Col>
            </Row>
        </>
    );
}