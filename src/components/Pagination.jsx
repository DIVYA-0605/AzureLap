import React from "react";
import { Flex, Button, Paragraph } from "@contentful/f36-components";

const Pagination = ({ currentPage, totalPages, onPrevious, onNext }) => (
  <Flex justifyContent="space-between" alignItems="center" style={{ marginTop: "auto" }}>
    <Button onClick={onPrevious} isDisabled={currentPage <= 1}>
      Previous
    </Button>
    <Paragraph>
      Page {currentPage} of {totalPages}
    </Paragraph>
    <Button onClick={onNext} isDisabled={currentPage >= totalPages}>
      Next
    </Button>
  </Flex>
);

export default Pagination;
