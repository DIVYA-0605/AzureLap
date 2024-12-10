import React from "react";
import { List, ListItem, Paragraph } from "@contentful/f36-components";

const WorkItemsList = ({ workItems, onWorkItemClick }) => {
  if (!workItems || workItems.length === 0) {
    return <Paragraph>No work items to display.</Paragraph>;
  }

  const validWorkItems = workItems.filter((item) => {
    if (!item?.fields?.["System.Title"]) {
      console.warn("Invalid work item detected:", item);
      return false;
    }
    return true;
  });

  return (
    <div
      style={{
        maxHeight: "200px",
        overflowY: "auto",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "8px",
        backgroundColor: "#fff",
        overflowX:"hidden"
      }}
    >
      <List style={{ margin: 0, padding: 0 }}>
        {validWorkItems.map((item) => (
          <ListItem
            key={item.id}
            onClick={() => onWorkItemClick(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onWorkItemClick(item);
              }
            }}
            style={{
              cursor: "pointer",
              padding: "6px 0",
              borderBottom: "1px solid #eaeaea",
              transition: "background-color 0.2s ease",
              
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            role="button"
            tabIndex="0"
          >
            <Paragraph
              style={{
                fontSize: "12px",
                margin: "0",
                fontWeight:"bold",
                
              }}
            >
              {item.fields["System.Title"] || "Untitled Work Item"}
            </Paragraph>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default WorkItemsList;
