import React from "react";
import { Row, Col, Table } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { DateFormat } from "../../components";
import { includes } from "lodash";
import useListsQueries from "../../../queries/lists";

export default function ReviewPersonDirectory() {
    const { getValues } = useFormContext();
    const [dir] = getValues(['person.directory']);
    return (
        <article className="border rounded p-2 mb-2">
            <Row as="header">
                <Col as="h5">Directory</Col>
            </Row>
            {dir.address.length>0&&<ReviewPersonDirectoryAddress data={dir.address}/>}
            {dir.phone.length>0&&<ReviewPersonDirectoryPhone data={dir.phone}/>}
            {dir.email.length>0&&<ReviewPersonDirectoryEmail data={dir.email}/>}
        </article>
    );
}
function ReviewPersonDirectoryAddress({data}) {
    const {getListData} = useListsQueries();
    const addressCodes = getListData('addressCodes');
    return (
        <section>
            <Row>
                <Col><h6 className="mb-0">Address:</h6></Col>
            </Row>
            <Row as="dl" className="mb-0">
                {addressCodes.data && data.map((a,i) => {
                    const addrType = addressCodes.data.filter(c=>c.id==a.ADDRESS_CODE)[0];
                    if (addrType == undefined) return null;
                    return (
                        <React.Fragment key={i}>
                            <Col as="dt" md={2} className="mb-0">Address Type:</Col>
                            <Col as="dd" md={10} className="mb-0">{addrType.title}</Col>
                            <Col as="dt" md={2} className="mb-3">Address:</Col>
                            <Col as="dd" md={10} className="mb-3">
                                <address>
                                    {includes(addrType?.fields,'line1')&&<p className="mb-0">{a.ADDRESS_1}</p>}
                                    {includes(addrType?.fields,'line2')&&<p className="mb-0">{a.ADDRESS_2}</p>}
                                    {includes(addrType?.fields,'department')&&<p className="mb-0">{a.department.label}</p>}
                                    {includes(addrType?.fields,'building')&&<p className="mb-0">{a.building.label}</p>}
                                    {includes(addrType?.fields,'room')&&<p className="mb-0">{a.ADDRESS_3}</p>}
                                    {includes(addrType?.fields,'line3')&&<p className="mb-0">{a.ADDRESS_3}</p>}
                                    {includes(addrType?.fields,'city')&&<p className="mb-0">{a.ADDRESS_CITY}, {a.STATE_CODE} {a.ADDRESS_POSTAL_CODE}</p>}
                                </address>
                            </Col>
                        </React.Fragment>
                    );
                })}
            </Row>
        </section>
    );
}
function ReviewPersonDirectoryPhone({data}) {
    return (
        <section>
            <Row>
                <Col><h6 className="mb-0">Phone:</h6></Col>
            </Row>
            <Table striped bordered size="sm">
                <thead className="bg-main text-white">
                    <tr>
                        <th>Type</th>
                        <th>Number</th>
                        <th>Effective Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((p,i)=>(
                        <tr key={i}>
                            <td>{p.PHONE_TYPE}</td>
                            <td>{p.PHONE_NUMBER}</td>
                            <td><DateFormat>{p.effDate}</DateFormat></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </section>
    );
}
function ReviewPersonDirectoryEmail({data}) {
    return (
        <section>
            <Row>
                <Col><h6 className="mb-0">Email:</h6></Col>
            </Row>
            <Table striped bordered size="sm">
                <thead className="bg-main text-white">
                    <tr>
                        <th>Type</th>
                        <th>Email</th>
                        <th>Effective Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((e,i)=>(
                        <tr key={i}>
                            <td>{e.EMAIL_TYPE}</td>
                            <td>{e.EMAIL_ADDRESS}</td>
                            <td><DateFormat>{e.effDate}</DateFormat></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </section>
    );
}