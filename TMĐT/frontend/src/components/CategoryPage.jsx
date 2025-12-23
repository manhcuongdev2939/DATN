import React from "react";
import { useParams } from "react-router-dom";
import ProductListPage from "./ProductListPage";

function CategoryPage() {
  const { id } = useParams();

  return (
    <ProductListPage
      title={null}
      categoryId={id}
    />
  );
}

export default CategoryPage;
