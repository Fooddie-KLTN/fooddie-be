<?php

namespace app\Enums;

enum Status: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case SHIPPING = 'shipping';
    case DELIVERED = 'delivered';
    case CANCELLED = 'cancelled';
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';
}