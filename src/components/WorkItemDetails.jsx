import React from "react";
import {
  Card,
  Flex,
  Menu,
  IconButton,
  Paragraph,
  Tooltip,
} from "@contentful/f36-components";
import { MoreHorizontalIcon } from "@contentful/f36-icons";

const WorkItemDetails = ({ workItem, onOpenInAzure, onUnlink }) => {
  // Function to extract initials from the assigned person's displayName
  const getInitials = (name) => {
    if (!name) return "U"; // Default to 'U' for 'Unassigned'
    const parts = name.split(" ");
    const firstInitial = parts[0]?.charAt(0).toUpperCase() || "";
    const lastInitial = parts[1]?.charAt(0).toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  };

  // Function to get text after the hyphen
  const getTextAfterHyphen = (text) => {
    const parts = text.split("-");
    return parts[1] ? parts[1].trim() : text; // Return the part after the hyphen, or the original text if no hyphen exists
  };

  // State-to-color mapping
  const stateColors = {
    "0 - New": { color: "#ffffff", textColor: "#000000" },
    "1.1 - In Requirements": { color: "#7fbce5", textColor: "#3b5d72" },
    "1.1.1 - Ready for Refinement": { color: "#86cdde", textColor: "#4a6d7a" },
    "1.1.2 - Requirements Adjustment": {
      color: "#86cdde",
      textColor: "#4a6d7a",
    },
    "1.2 - Ready for Estimate": { color: "#86cdde", textColor: "#4a6d7a" },
    "1.3 - Product Blocked": { color: "#e60017", textColor: "#ffffff" },
    "2.1 - Ready for Development": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.2 - In Progress": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.3 - Ready for Code Review": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.4 - Code Review In Progress": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.4.1 - Pull Request Rejected": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.5 - Ready to Build": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.5.1 - Build Complete": { color: "#aa9cdf", textColor: "#4a5c6c" },
    "2.6 - Dev Blocked": { color: "#e60017", textColor: "#ffffff" },
    "2.7 - Dependent on Other Work Item": {
      color: "#e60017",
      textColor: "#ffffff",
    },
    "3.1 - Ready for Test": { color: "#f7a24b", textColor: "#3b4e4d" },
    "3.2 - QA in Progress": { color: "#f7a24b", textColor: "#3b4e4d" },
    "3.2.1 - Rejected by QA": { color: "#fbfd52", textColor: "#4a5c6c" },
    "3.3 - QA Blocked": { color: "#e60017", textColor: "#ffffff" },
    "3.4 - QA Approved": { color: "#f7a24b", textColor: "#3b4e4d" },
    "3.4.1 - Ready for Demo": { color: "#f7a24b", textColor: "#3b4e4d" },
    "4.1 - Ready for Release": { color: "#60af49", textColor: "#ffffff" },
    "4.2 - Scheduled for Release": { color: "#60af49", textColor: "#ffffff" },
    "5 - Done": { color: "#4E9D5D", textColor: "#ffffff" },
    "6 - Removed": { color: "#888888", textColor: "#ffffff" },
  };

  const assignedTo = workItem.fields["System.AssignedTo"];
  const displayName = assignedTo?.displayName || "Unassigned";
  const initials = getInitials(displayName);

  // Extracting and processing state
  const rawState = workItem.fields["System.State"];
  const processedState = getTextAfterHyphen(rawState);

  // Get color from the state
  const { color: backgroundColor, textColor } = stateColors[rawState] || {
    color: "#ffffff",
    textColor: "#000000",
  };
  //   const workItemTypeUrl = workItem._links["workItemType"]?.href;
  // console.log("workItemType:",workItemTypeUrl)
  return (
    <Card padding="none">
      <Flex
        justifyContent="space-between"
        alignItems="center"
        paddingLeft="spacingS"
        paddingRight="spacingS"
      >
        {/* Display the processed state */}
        <Paragraph
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            marginTop: "0.5rem",
            marginBottom: "0.75rem",
            fontSize: "12px",
          }}
        >
          {processedState}
        </Paragraph>
        <Menu>
          <Menu.Trigger>
            <IconButton
              variant="transparent"
              icon={<MoreHorizontalIcon />}
              aria-label="Actions"
              style={{
                backgroundColor: "transparent",
                border: "none",
                boxShadow: "none",
                padding: "0px",
                margin: "0px",
                minWidth: "0px",
                minHeight: "0px",
              }}
              className="no-hover"
            />
          </Menu.Trigger>
          <Menu.List>
            <Menu.Item onClick={() => onOpenInAzure(workItem.id)}>
              Open in Azure
            </Menu.Item>
            <Menu.Item onClick={onUnlink}>Unlink</Menu.Item>
          </Menu.List>
        </Menu>
      </Flex>
      <Paragraph
        as="span"
        style={{
          fontSize: "12px",
          margin: 0,
          paddingLeft: "0.75rem",
          paddingRight: "0.75rem",
          fontWeight: "bold",
          marginBottom: "0.75rem",
          color: "black",
          textDecoration: "none",
          cursor: "pointer",
          display: "block",
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "#007ACC";
          e.target.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "black";
          e.target.style.textDecoration = "none";
        }}
        onClick={() => {
          window.open(
            `https://bofaz.visualstudio.com/${process.env.REACT_APP_AZURE_DEVOPS_PROJECT}/_workitems/edit/${workItem.id}`,
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        {workItem.fields["System.Title"]}
      </Paragraph>

      <Flex
        alignItems="center"
        paddingLeft="spacingS"
        justifyContent="flex-end"
        paddingRight="spacingS"
        paddingBottom="spacingXs"
      >
        <Tooltip content={`Assignee: ${displayName}`}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: "#007ACC",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "bold",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            {initials}
          </div>
        </Tooltip>
      </Flex>
    </Card>
  );
};

export default WorkItemDetails;
