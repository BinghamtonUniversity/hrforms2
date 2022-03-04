import React,{useState,useEffect} from "react";
import {Link} from "react-router-dom";
import {Navbar,Nav,NavDropdown} from "react-bootstrap";
import {currentUser,getAuthInfo} from "../app";

export default function AppNav({userCounts}) {
    const {SUNY_ID,isAdmin} = getAuthInfo();
    const user = currentUser();
    const [requests,setRequests] = useState(new Map());
    const [forms,setForms] = useState(new Map());

    const logout = e => {
        e.preventDefault();
        //clearAuth();
        console.log('logout');
    }
    useEffect(() => {
        if (userCounts) {
            if (userCounts.requests) setRequests(new Map(Object.entries(userCounts.requests)));
            if (userCounts.forms) setForms(new Map(Object.entries(userCounts.forms)));
        }
    },[userCounts]);
    //TODO: check a/b match; if different and isAdmin then impersonation; otherwise kickout.
    //(!isAdmin && SUNY_ID != user.SUNY_ID)
    return (
        <header>
            <Navbar bg="main" variant="dark" expand="lg" className="mb-4 shadow" fixed="top" collapseOnSelect={true}>
                <Navbar.Brand href="#home">HR Forms 2</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav>
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        {(requests.size > 0) &&
                        <NavDropdown title="Request" id="request-nav-dropdown" alignRight>
                            <NavDropdown.Item as={Link} to="/request/">New Request</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            {requests.has('draft') && <NavDropdown.Item as={Link} to="/request/list/drafts">Drafts ({requests.get('draft')})</NavDropdown.Item>}
                            {requests.has('approval') && <NavDropdown.Item as={Link} to="/request/list/approvals">Approvals ({requests.get('approval')})</NavDropdown.Item>}
                            {requests.has('final') && <NavDropdown.Item as={Link} to="/request/list/final">Final Approvals ({requests.get('final')})</NavDropdown.Item>}
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/request/list/submitted">My Requests</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/request/list">List</NavDropdown.Item>
                        </NavDropdown>}
                        {(forms.size > 0) && 
                        <NavDropdown title="Forms" id="forms-nav-dropdown" alignRight>
                            <NavDropdown.Item as={Link} to="/form/">New Form</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            {forms.has('draft') && <NavDropdown.Item as={Link} to="/form/list/drafts">Drafts ({forms.get('draft')})</NavDropdown.Item>}
                            {forms.has('approval') && <NavDropdown.Item as={Link} to="/form/list/approvals">Approvals ({forms.get('approval')})</NavDropdown.Item>}
                            {forms.has('rejection') && <NavDropdown.Item as={Link} to="/form/list/rejections">Rejections ({forms.get('rejection')})</NavDropdown.Item>}
                            {forms.has('final') && <NavDropdown.Item as={Link} to="/form/list/final">Final Approvals ({forms.get('final')})</NavDropdown.Item>}
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/request/list">List</NavDropdown.Item>
                        </NavDropdown>}
                        {(isAdmin && SUNY_ID == user.SUNY_ID) &&
                        <NavDropdown title="Admin" id="admin-nav-dropdown" alignRight>
                            <NavDropdown.Item as={Link} to="/admin/news">News</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/journal">Journal</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/users">Users</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/groups">Groups</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/departments">Departments</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/lists">Lists</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/hierarchy/form" disabled>Form Hierarchy</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/hierarchy/request">Request Hierarchy</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/settings">Settings</NavDropdown.Item>
                        </NavDropdown>}
                        <Nav.Link onClick={logout}>Logout</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </header>
    );
}