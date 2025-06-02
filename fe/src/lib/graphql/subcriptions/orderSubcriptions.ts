import { gql } from '@apollo/client';

export const ORDER_CREATED_SUBSCRIPTION = gql`
  subscription OrderCreated($restaurantId: String!) {
    orderCreated(restaurantId: $restaurantId) {
      id
      status
      total
      note
      createdAt
      restaurant {
        id
        name
      }
      user {
        id
        name
        phone
      }
      orderDetails {
        id
        quantity
        price
        food {
          id
          name
          image
        }
      }
      address {
        street
        ward
        district
        city
      }
    }
  }
`;